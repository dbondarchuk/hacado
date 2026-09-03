import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  DateRange,
  IConnectedAppProps,
  Query,
  WithTotal,
  type EventSource,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex } from "@hacado/utils";
import { ObjectId, type Filter, type Sort } from "mongodb";
import {
  WaitlistEntry,
  WaitlistEntryEntity,
  WaitlistRequest,
  WaitlistStatus,
} from "../models";
import {
  WAITLIST_ENTRIES_DISMISSED_EVENT_TYPE,
  WAITLIST_ENTRY_CREATED_EVENT_TYPE,
} from "../models/events";

export const WAITLIST_COLLECTION_NAME = "waitlist";

export class WaitlistRepositoryService {
  protected readonly loggerFactory: LoggerFactory;

  public constructor(
    protected readonly appId: string,
    protected readonly organizationId: string,
    protected readonly getDbConnection: IConnectedAppProps["getDbConnection"],
    protected readonly services: IConnectedAppProps["services"],
  ) {
    this.loggerFactory = getLoggerFactory(
      "WaitlistRepositoryService",
      this.organizationId,
    );
  }

  public async createWaitlistEntry(
    entry: WaitlistRequest,
    source: EventSource,
  ): Promise<WaitlistEntry> {
    const logger = this.loggerFactory("createWaitlistEntry");
    logger.debug({ entry }, "Creating waitlist entry");

    const customer = await this.services.customersService.getOrUpsertCustomer(
      entry,
      source,
    );

    const db = await this.getDbConnection();
    const waitlistEntry = {
      ...entry,
      _id: new ObjectId().toString(),
      appId: this.appId,
      customerId: customer._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
      organizationId: this.organizationId,
    } satisfies WaitlistEntryEntity;

    await db
      .collection<WaitlistEntryEntity>(WAITLIST_COLLECTION_NAME)
      .insertOne(waitlistEntry);

    logger.debug(
      { waitlistEntry },
      "Waitlist entry created, hydrating from db",
    );

    const entity = await this.getWaitlistEntry(waitlistEntry._id);

    logger.debug({ waitlistEntry }, "Waitlist entry created, executing hooks");

    const emitSource: EventSource =
      source.actor === "customer"
        ? { actor: "customer", actorId: customer._id }
        : source;

    await this.services.eventService.emit(
      WAITLIST_ENTRY_CREATED_EVENT_TYPE,
      {
        entry: entity!,
      },
      emitSource,
    );

    return entity!;
  }

  public async getWaitlistEntriesCount(
    date?: Date,
  ): Promise<{ newCount: number; totalCount: number }> {
    const logger = this.loggerFactory("getWaitlistEntriesCount");
    logger.debug({ date }, "Getting waitlist entries count");

    const db = await this.getDbConnection();
    const collection = db.collection<WaitlistEntryEntity>(
      WAITLIST_COLLECTION_NAME,
    );

    const $and: Filter<WaitlistEntryEntity>[] = [
      {
        organizationId: this.organizationId,
        appId: this.appId,
      },
      {
        status: "active",
      },
      {
        $or: [
          { asSoonAsPossible: { $eq: true } },
          { "dates.date": { $gte: new Date().toISOString().split("T")[0] } },
        ],
      },
    ];

    const dateMatch = date
      ? [
          {
            $match: {
              createdAt: {
                $gte: date,
              },
            },
          },
        ]
      : [];

    const [result] = await collection
      .aggregate([
        {
          $match: {
            $and,
          },
        },
        {
          $facet: {
            newCount: [
              ...dateMatch,
              {
                $count: "count",
              },
            ],
            totalCount: [
              {
                $count: "count",
              },
            ],
          },
        },
      ])
      .toArray();

    const response = {
      newCount: result.newCount?.[0]?.count || 0,
      totalCount: result.totalCount?.[0]?.count || 0,
    };

    logger.debug({ date, response }, "Waitlist entries count retrieved");

    return response;
  }

  public async getWaitlistEntries(
    query: Query & {
      optionId?: string | string[];
      customerId?: string | string[];
      memberId?: string | string[];
      range?: DateRange;
      status?: (WaitlistStatus | "expired")[];
      ids?: string[];
    },
  ): Promise<WithTotal<WaitlistEntry>> {
    const logger = this.loggerFactory("getWaitlistEntries");
    logger.debug({ query }, "Getting waitlist entries");

    const db = await this.getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { createdAt: 1 };

    const $and: Filter<WaitlistEntry>[] = [
      {
        organizationId: this.organizationId,
        appId: this.appId,
      },
    ];

    if (query.range?.start || query.range?.end) {
      const dateConditions: Record<string, any> = {};

      // Since dates.date is stored as a string (ISO YYYY-MM-DD), comparing lexicographically works correctly for date ordering.

      const $or: Filter<WaitlistEntry>[] = [];
      $or.push({ asSoonAsPossible: { $eq: true } });

      if (query.range?.start) {
        dateConditions.$exists = true;
        dateConditions.$gte = query.range.start.toISOString().split("T")[0]; // YYYY-MM-DD
      }

      if (query.range?.end) {
        dateConditions.$exists = true;
        dateConditions.$lte = query.range.end.toISOString().split("T")[0]; // YYYY-MM-DD
      }

      $or.push({ "dates.date": dateConditions });
      $and.push({ $or });
    }

    if (query.customerId) {
      $and.push({
        customerId: {
          $in: Array.isArray(query.customerId)
            ? query.customerId
            : [query.customerId],
        },
      });
    }

    if (query.memberId) {
      $and.push({
        memberId: {
          $in: Array.isArray(query.memberId)
            ? query.memberId
            : [query.memberId],
        },
      });
    }

    if (query.ids) {
      $and.push({
        _id: { $in: query.ids },
      });
    }

    if (query.optionId) {
      $and.push({
        "option._id": {
          $in: Array.isArray(query.optionId)
            ? query.optionId
            : [query.optionId],
        },
      });
    }

    if (query.status) {
      const compatibleStatuses = query.status.filter(
        (status) => status !== "expired",
      );
      $and.push({
        status: { $in: compatibleStatuses },
      });

      // If we are not fetching expired entries, we need to add the date range filter to the query.
      if (!query.status.includes("expired")) {
        const dateConditions: Record<string, any> = {};

        // Since dates.date is stored as a string (ISO YYYY-MM-DD), comparing lexicographically works correctly for date ordering.

        const $or: Filter<WaitlistEntry>[] = [];
        $or.push({ asSoonAsPossible: { $eq: true } });

        dateConditions.$exists = true;
        dateConditions.$gte = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        $or.push({ "dates.date": dateConditions });
        $and.push({ $or });
      }
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<WaitlistEntry>(
        { $regex },
        "option.name",
        "addons.name",
        "addons.description",
        "name",
        "email",
        "phone",
        "customer.knownNames",
        "customer.knownEmails",
        "customer.knownPhones",
      );

      $and.push({ $or: queries });
    }

    const filter: Filter<WaitlistEntry> = $and.length > 0 ? { $and } : {};

    const [result] = await db
      .collection<WaitlistEntry>(WAITLIST_COLLECTION_NAME)
      .aggregate([
        ...this.waitlistAggregateJoin,
        {
          $match: filter,
        },
        {
          $sort: sort,
        },
        {
          $facet: {
            paginatedResults:
              query.limit === 0
                ? undefined
                : [
                    ...(typeof query.offset !== "undefined"
                      ? [{ $skip: query.offset }]
                      : []),
                    ...(typeof query.limit !== "undefined"
                      ? [{ $limit: query.limit }]
                      : []),
                  ],
            totalCount: [
              {
                $count: "count",
              },
            ],
          },
        },
      ])
      .toArray();

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items: result.paginatedResults || [],
    };

    logger.info(
      {
        result: { total: response.total, count: response.items.length },
        query,
      },
      "Fetched waitlist entries",
    );

    return response;
  }

  public async getWaitlistEntry(id: string): Promise<WaitlistEntry | null> {
    const logger = this.loggerFactory("getWaitlistEntry");
    logger.debug({ waitlistEntryId: id }, "Getting waitlist entry by id");

    const db = await this.getDbConnection();
    const waitlistEntry = await db
      .collection<WaitlistEntry>(WAITLIST_COLLECTION_NAME)
      .aggregate([
        ...this.waitlistAggregateJoin,
        {
          $match: {
            _id: id,
            organizationId: this.organizationId,
            appId: this.appId,
          },
        },
      ])
      .next();

    if (!waitlistEntry) {
      logger.warn({ waitlistEntryId: id }, "Waitlist entry not found");
    } else {
      logger.debug(
        { waitlistEntryId: id, customerName: waitlistEntry.customer?.name },
        "Waitlist entry found",
      );
    }

    return waitlistEntry as WaitlistEntry | null;
  }

  public async dismissWaitlistEntry(
    id: string,
    source: EventSource,
  ): Promise<WaitlistEntry | null> {
    const logger = this.loggerFactory("dismissWaitlistEntry");
    logger.debug({ waitlistEntryId: id }, "Dismissing waitlist entry by id");

    const entity = await this.getWaitlistEntry(id);
    if (!entity) {
      logger.warn({ waitlistEntryId: id }, "Waitlist entry not found");
      return null;
    }

    await this.dismissWaitlistEntries([id], source);

    return entity;
  }

  public async dismissWaitlistEntries(
    ids: string[],
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("dismissWaitlistEntries");
    logger.debug(
      { waitlistEntryIds: ids },
      "Dismissing waitlist entries by ids",
    );

    const db = await this.getDbConnection();
    const { modifiedCount } = await db
      .collection<WaitlistEntryEntity>(WAITLIST_COLLECTION_NAME)
      .updateMany(
        {
          _id: { $in: ids },
          organizationId: this.organizationId,
          appId: this.appId,
        },
        { $set: { status: "dismissed", updatedAt: new Date() } },
      );

    logger.debug(
      { waitlistEntryIds: ids, modifiedCount },
      "Waitlist entries dismissed, executing hooks",
    );

    const waitlistEntries = await this.getWaitlistEntries({
      ids,
      status: ["dismissed"],
    });

    const entriesIds = waitlistEntries.items.map((entry) => entry._id);
    logger.debug(
      { waitlistEntryIds: entriesIds },
      "Waitlist entries dismissed, executing hooks",
    );

    await this.services.eventService.emit(
      WAITLIST_ENTRIES_DISMISSED_EVENT_TYPE,
      {
        entries: waitlistEntries.items,
      },
      source,
    );
  }

  public async installWaitlistApp() {
    const logger = this.loggerFactory("installWaitlistApp");
    logger.debug("Installing waitlist app");

    const db = await this.getDbConnection();
    const collection = await db.createCollection<WaitlistEntry>(
      WAITLIST_COLLECTION_NAME,
    );

    const indexes = {
      organizationId_appId_createdAt_1: {
        organizationId: 1,
        appId: 1,
        createdAt: 1,
      },
      organizationId_appId_status_1: { organizationId: 1, appId: 1, status: 1 },
      organizationId_appId_customerId_1: {
        organizationId: 1,
        appId: 1,
        customerId: 1,
      },
      organizationId_appId_optionId_1: {
        organizationId: 1,
        appId: 1,
        optionId: 1,
      },
      organizationId_appId_asSoonAsPossible_1: {
        organizationId: 1,
        appId: 1,
        asSoonAsPossible: 1,
      },
      organizationId_appId_dates_date_1: {
        organizationId: 1,
        appId: 1,
        "dates.date": 1,
      },
    };

    for (const [name, index] of Object.entries(indexes)) {
      logger.debug(`Checking if index ${name} exists`);
      if (await collection.indexExists(name)) {
        logger.debug(`Index ${name} already exists`);
        continue;
      }

      logger.debug(`Creating index ${name}`);
      await collection.createIndex(index, { name });
    }

    logger.debug("Waitlist app installed");
  }

  public async findNextActiveMatchingEntry(params: {
    memberId: string;
    afterCreatedAt?: Date;
  }): Promise<WaitlistEntry | null> {
    const logger = this.loggerFactory("findNextActiveMatchingEntry");
    logger.debug(params, "Finding next active waitlist entry for opened slot");

    const db = await this.getDbConnection();
    const filter: Filter<WaitlistEntryEntity> = {
      organizationId: this.organizationId,
      appId: this.appId,
      status: "active",
      memberId: params.memberId,
      ...(params.afterCreatedAt
        ? { createdAt: { $gt: params.afterCreatedAt } }
        : {}),
    };

    const entity = await db
      .collection<WaitlistEntryEntity>(WAITLIST_COLLECTION_NAME)
      .find(filter)
      .sort({ createdAt: 1 })
      .limit(1)
      .next();

    if (!entity) {
      return null;
    }

    return this.getWaitlistEntry(entity._id);
  }

  public async setLastSlotOpenedNotifiedAt(
    id: string,
    at: Date,
    slotStart: Date,
  ): Promise<void> {
    const db = await this.getDbConnection();
    await db
      .collection<WaitlistEntryEntity>(WAITLIST_COLLECTION_NAME)
      .updateOne(
        {
          _id: id,
          organizationId: this.organizationId,
          appId: this.appId,
        },
        {
          $set: { lastSlotOpenedNotifiedAt: at, updatedAt: new Date() },
          $addToSet: { slotOpenedNotifiedStarts: slotStart },
        },
      );
  }

  public async customerHasNotifiedSlotStart(params: {
    customerId: string;
    memberId: string;
    slotStart: Date;
  }): Promise<boolean> {
    const db = await this.getDbConnection();
    const found = await db
      .collection<WaitlistEntryEntity>(WAITLIST_COLLECTION_NAME)
      .findOne(
        {
          organizationId: this.organizationId,
          appId: this.appId,
          status: "active",
          customerId: params.customerId,
          memberId: params.memberId,
          slotOpenedNotifiedStarts: params.slotStart,
        },
        { projection: { _id: 1 } },
      );
    return found != null;
  }

  public async getDistinctActiveWaitlistMemberIds(): Promise<string[]> {
    const db = await this.getDbConnection();
    const ids = await db
      .collection<WaitlistEntryEntity>(WAITLIST_COLLECTION_NAME)
      .distinct("memberId", {
        organizationId: this.organizationId,
        appId: this.appId,
        status: "active",
      });

    return ids.filter((id): id is string => typeof id === "string" && !!id);
  }

  public async getActiveWaitlistEntities(
    memberIds?: string[],
  ): Promise<WaitlistEntryEntity[]> {
    const db = await this.getDbConnection();
    const filter: Filter<WaitlistEntryEntity> = {
      organizationId: this.organizationId,
      appId: this.appId,
      status: "active",
      ...(memberIds?.length ? { memberId: { $in: memberIds } } : {}),
    };

    return db
      .collection<WaitlistEntryEntity>(WAITLIST_COLLECTION_NAME)
      .find(filter)
      .sort({ createdAt: 1 })
      .toArray();
  }

  private get waitlistAggregateJoin() {
    return [
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "member",
        },
      },
      {
        $lookup: {
          from: "options",
          localField: "optionId",
          foreignField: "_id",
          as: "option",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                price: 1,
                duration: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "addons",
          localField: "addonsIds",
          foreignField: "_id",
          as: "addons",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                price: 1,
                duration: 1,
              },
            },
          ],
        },
      },
      {
        $set: {
          customer: {
            $first: "$customer",
          },
          option: {
            $first: "$option",
          },
          member: {
            $first: "$member",
          },
        },
      },
    ];
  }
}
