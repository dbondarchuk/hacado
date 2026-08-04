import type {
  ActivityEntry,
  ActivityFeedPreview,
  ActivityListItem,
  ActivityListQuery,
  ActivityRecord,
  ActivitySeverity,
  IActivityService,
  IDashboardNotificationsService,
  WithTotal,
} from "@timelish/types";
import { escapeRegex } from "@timelish/utils";
import type { Redis } from "ioredis";
import type { Document, Filter } from "mongodb";
import { ObjectId } from "mongodb";
import {
  ACTIVITIES_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
  MEMBERS_COLLECTION_NAME,
} from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

export class ActivityService extends BaseService implements IActivityService {
  public constructor(
    organizationId: string,
    private readonly dashboardNotifications: IDashboardNotificationsService,
    private readonly redisClient: Redis,
  ) {
    super("ActivityService", organizationId);
  }

  private lastReadRedisKey(memberId: string): string {
    return `activityFeed:lastReadAt:${this.organizationId}:${memberId}`;
  }

  private entryToPreview(entry: ActivityListItem): ActivityFeedPreview {
    return {
      id: entry._id,
      eventType: entry.eventType,
      createdAt: entry.createdAt.toISOString(),
      severity: entry.severity ?? "info",
      title: entry.title,
      link: entry.link,
      actor: entry.actorDisplay,
    };
  }

  public async getActivityPreview(
    limit: number,
  ): Promise<ActivityFeedPreview[]> {
    const { items } = await this.getActivities({
      limit,
      offset: 0,
      sort: [{ id: "createdAt", desc: true }],
    });
    return items.map((e) => this.entryToPreview(e));
  }

  public async getUnreadActivityCount(memberId: string): Promise<number> {
    const logger = this.loggerFactory("getUnreadActivityCount");
    logger.debug({ memberId }, "Getting unread activity count");

    const lastRead = await this.redisClient.get(
      this.lastReadRedisKey(memberId),
    );
    const lastReadDate = lastRead ? new Date(lastRead) : new Date(0);
    const db = await getDbConnection();
    const count = await db
      .collection<ActivityEntry>(ACTIVITIES_COLLECTION_NAME)
      .countDocuments({
        organizationId: this.organizationId,
        createdAt: { $gt: lastReadDate },
      });

    logger.debug({ memberId, count }, "Unread activity count");
    return count;
  }

  public async getHighestSeveritySinceLastRead(
    memberId: string,
  ): Promise<ActivitySeverity | null> {
    const logger = this.loggerFactory("getHighestSeveritySinceLastRead");
    logger.debug({ memberId }, "Getting highest severity since last read");

    const lastRead = await this.redisClient.get(
      this.lastReadRedisKey(memberId),
    );
    const lastReadDate = lastRead ? new Date(lastRead) : new Date(0);
    const db = await getDbConnection();
    const activities = db.collection<ActivityEntry>(ACTIVITIES_COLLECTION_NAME);

    const result = await activities
      .aggregate<ActivityEntry>([
        {
          $match: {
            organizationId: this.organizationId,
            createdAt: { $gt: lastReadDate },
            // Ignore activities performed by the same member.
            $nor: [{ "source.actor": "member", "source.actorId": memberId }],
          },
        },
        {
          $set: {
            severityRank: {
              $switch: {
                branches: [
                  { case: { $eq: ["$severity", "error"] }, then: 3 },
                  { case: { $eq: ["$severity", "warning"] }, then: 2 },
                  { case: { $eq: ["$severity", "success"] }, then: 1 },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { severityRank: -1 } },
        { $project: { severity: 1 } },
        { $limit: 1 },
      ])
      .toArray();

    const highestSeverity =
      result.length > 0 ? (result[0].severity ?? "info") : null;
    logger.debug(
      { memberId, highestSeverity },
      "Highest severity since last read",
    );
    return highestSeverity;
  }

  public async markActivityFeedRead(memberId: string): Promise<void> {
    const logger = this.loggerFactory("markActivityFeedRead");
    logger.debug({ memberId }, "Marking activity feed as read");

    await this.redisClient.set(
      this.lastReadRedisKey(memberId),
      new Date().toISOString(),
    );

    logger.debug({ memberId }, "Activity feed marked as read");
  }

  private async publishActivityFeedUpdate(id: string): Promise<void> {
    const logger = this.loggerFactory("publishActivityFeedUpdate");
    const entry = await this.getActivity(id);
    if (!entry) {
      logger.warn({ id }, "Activity entry not found");
      return;
    }

    const preview = this.entryToPreview(entry);
    logger.debug({ preview }, "Publishing activity feed");

    await this.dashboardNotifications.publishNotification({
      type: "activity-feed",
      activityFeed: { preview: [preview] },
    });
  }

  public async record(activity: ActivityRecord): Promise<string> {
    const logger = this.loggerFactory("record");
    logger.debug({ activity }, "Recording activity");
    const db = await getDbConnection();
    const collection = db.collection<ActivityEntry>(ACTIVITIES_COLLECTION_NAME);

    const entry: ActivityEntry = {
      _id: new ObjectId().toString(),
      organizationId: this.organizationId,
      ...activity,
      severity: activity.severity ?? "info",
      createdAt: new Date(),
    };

    await collection.insertOne(entry);
    logger.debug(
      { activityId: entry._id, eventType: activity.eventType },
      "Activity recorded",
    );

    await this.publishActivityFeedUpdate(entry._id);

    return entry._id;
  }

  public async getActivities(
    query: ActivityListQuery,
  ): Promise<WithTotal<ActivityListItem>> {
    const logger = this.loggerFactory("getActivities");
    logger.debug({ query }, "Listing activities");

    const db = await getDbConnection();
    const collection = db.collection<ActivityEntry>(ACTIVITIES_COLLECTION_NAME);

    const filter: Filter<ActivityEntry> = {
      organizationId: this.organizationId,
    };

    if (query.range?.start || query.range?.end) {
      const createdAt: { $gte?: Date; $lte?: Date } = {};
      if (query.range.start) {
        createdAt.$gte = query.range.start;
      }
      if (query.range.end) {
        createdAt.$lte = query.range.end;
      }
      filter.createdAt = createdAt;
    }

    if (query.eventType?.length) {
      filter.eventType = { $in: query.eventType };
    }

    if (query.severity?.length) {
      filter.severity = { $in: query.severity };
    }

    if (query.actor?.length) {
      filter["source.actor"] = { $in: query.actor };
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      filter.$or = [{ eventType: $regex }, { link: $regex }];
    }

    const sort: Record<string, 1 | -1> = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? (-1 as const) : (1 as const),
      }),
      {} as Record<string, 1 | -1>,
    ) ?? { createdAt: -1 };

    const pipeline: Document[] = [
      { $match: filter as Document },
      ...this.aggregationJoin,
      { $sort: sort },
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
    ];

    const [result] = await collection
      .aggregate<{
        paginatedResults: ActivityListItem[];
        totalCount: { count: number }[];
      }>(pipeline)
      .toArray();

    const rawItems = result?.paginatedResults ?? [];
    const total = result?.totalCount?.[0]?.count ?? 0;

    const items: ActivityListItem[] = rawItems.map((doc) => ({
      ...doc,
      severity: doc.severity ?? "info",
    }));

    logger.debug({ total, count: items.length }, "Activities listed");

    return { items, total };
  }

  private async getActivity(id: string): Promise<ActivityListItem | null> {
    const logger = this.loggerFactory("getActivity");
    logger.debug({ id }, "Getting activity entry");
    const db = await getDbConnection();
    const collection = db.collection<ActivityListItem>(
      ACTIVITIES_COLLECTION_NAME,
    );
    const entry = await collection
      .aggregate([
        { $match: { _id: id, organizationId: this.organizationId } },
        ...this.aggregationJoin,
      ])
      .next();

    if (!entry) {
      logger.warn({ id }, "Activity entry not found");
      return null;
    }

    logger.debug({ id }, "Activity entry found");
    return entry as ActivityListItem;
  }

  public async getDistinctEventTypes(options: {
    search?: string;
    offset: number;
    limit: number;
  }): Promise<WithTotal<string>> {
    const logger = this.loggerFactory("getDistinctEventTypes");
    logger.debug({ options }, "Listing distinct activity event types");

    const db = await getDbConnection();
    const collection = db.collection<ActivityEntry>(ACTIVITIES_COLLECTION_NAME);

    const match: Filter<ActivityEntry> = {
      organizationId: this.organizationId,
    };
    if (options.search) {
      match.eventType = {
        $regex: new RegExp(escapeRegex(options.search), "i"),
      };
    }

    const pipeline: Document[] = [
      { $match: match },
      { $group: { _id: "$eventType" } },
      {
        $match: {
          _id: { $nin: [null, ""] },
        },
      },
      { $sort: { _id: 1 } },
      {
        $facet: {
          paginatedResults: [
            { $skip: options.offset },
            { $limit: options.limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await collection
      .aggregate<{
        paginatedResults: { _id: string | null }[];
        totalCount: { count: number }[];
      }>(pipeline)
      .toArray();

    const raw = result?.paginatedResults ?? [];
    const items = raw
      .map((r) => r._id)
      .filter((x): x is string => typeof x === "string" && x.length > 0);
    const total = result?.totalCount?.[0]?.count ?? 0;

    logger.debug({ total, count: items.length }, "Distinct event types listed");

    return { items, total };
  }

  private get aggregationJoin() {
    return [
      {
        $lookup: {
          from: MEMBERS_COLLECTION_NAME,
          let: { actorId: "$source.actorId", actor: "$source.actor" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$$actor", "member"] },
                    { $eq: [{ $toString: "$_id" }, "$$actorId"] },
                    { $eq: ["$organizationId", this.organizationId] },
                  ],
                },
              },
            },
            { $project: { name: 1 } },
          ],
          as: "actorMember",
        },
      },
      {
        $lookup: {
          from: CUSTOMERS_COLLECTION_NAME,
          let: { actorId: "$source.actorId", actor: "$source.actor" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$$actor", "customer"] },
                    { $eq: ["$_id", "$$actorId"] },
                    { $eq: ["$organizationId", this.organizationId] },
                  ],
                },
              },
            },
            { $project: { name: 1 } },
          ],
          as: "actorCustomer",
        },
      },
      {
        $set: {
          actorDisplay: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$source.actor", "system"] },
                  then: { kind: "system" },
                },
                {
                  case: { $eq: ["$source.actor", "visitor"] },
                  then: {
                    kind: "visitor",
                    name: { $ifNull: ["$source.actorName", ""] },
                  },
                },
                {
                  case: { $eq: ["$source.actor", "member"] },
                  then: {
                    kind: "member",
                    memberId: { $ifNull: ["$source.actorId", ""] },
                    name: {
                      $cond: {
                        if: { $gt: [{ $size: "$actorMember" }, 0] },
                        then: { $arrayElemAt: ["$actorMember.name", 0] },
                        else: "Unknown member",
                      },
                    },
                  },
                },
                {
                  case: { $eq: ["$source.actor", "customer"] },
                  then: {
                    kind: "customer",
                    customerId: { $ifNull: ["$source.actorId", ""] },
                    isDeleted: {
                      $ifNull: [
                        { $arrayElemAt: ["$actorCustomer.isDeleted", 0] },
                        false,
                      ],
                    },
                    name: {
                      $cond: {
                        if: { $gt: [{ $size: "$actorCustomer" }, 0] },
                        then: { $arrayElemAt: ["$actorCustomer.name", 0] },
                        else: "Unknown customer",
                      },
                    },
                  },
                },
              ],
              default: { kind: "system" },
            },
          },
        },
      },
      { $unset: ["actorMember", "actorCustomer"] },
    ];
  }
}
