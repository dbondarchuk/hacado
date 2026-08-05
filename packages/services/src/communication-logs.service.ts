import {
  CommunicationChannel,
  CommunicationDirection,
  CommunicationLog,
  CommunicationLogContentPayload,
  CommunicationLogCreateInput,
  CommunicationLogEntity,
  CommunicationParticipantType,
  DateRange,
  IAssetsStorage,
  ICommunicationLogsService,
  Query,
  WithTotal,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex, stream2buffer } from "@hacado/utils";
import { Filter, ObjectId, Sort } from "mongodb";
import { Readable } from "stream";
import {
  APPOINTMENTS_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
  LOG_COLLECTION_NAME,
  MEMBERS_COLLECTION_NAME,
} from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

type CommunicationLogSearchable = CommunicationLog & { text?: string };

const COMMUNICATION_LOG_PREVIEW_MAX_LENGTH = 50;

const communicationLogPayloadFilename = (logId: string) =>
  `communication-logs/${logId}.json`;

function communicationLogTextPreview(
  text: string,
  maxLength = COMMUNICATION_LOG_PREVIEW_MAX_LENGTH,
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return normalized.slice(0, maxLength);
}

function communicationLogHasPayloadData(data: unknown): boolean {
  return data !== undefined && data !== null;
}

export class CommunicationLogsService
  extends BaseService
  implements ICommunicationLogsService
{
  public constructor(
    organizationId: string,
    private readonly assetsStorage: IAssetsStorage,
  ) {
    super("CommunicationLogsService", organizationId);
  }

  public async log(log: CommunicationLogCreateInput) {
    const {
      channel,
      direction,
      appointmentId,
      customerId,
      participantType,
      participant,
      text,
      html,
      data,
      subject,
      handledBy,
    } = log;
    const memberId = log.memberId;
    const logArgs = {
      channel,
      direction,
      appointmentId,
      customerId,
      participantType,
      participant,
      memberId,
    };

    const logger = this.loggerFactory("log");
    logger.debug({ logArgs }, "Logging new communication");
    const db = await getDbConnection();
    const collection =
      db.collection<CommunicationLogEntity>(LOG_COLLECTION_NAME);

    const _id = new ObjectId().toString();
    const payload: CommunicationLogContentPayload = {
      text,
      ...(html !== undefined ? { html } : {}),
      ...(data !== undefined ? { data } : {}),
    };
    const json = JSON.stringify(payload);
    const body = Buffer.from(json, "utf8");

    await this.assetsStorage.saveFile(
      communicationLogPayloadFilename(_id),
      Readable.from(body),
      body.length,
    );

    await collection.insertOne({
      direction,
      channel,
      participant,
      participantType,
      ...(memberId ? { memberId } : {}),
      handledBy,
      subject,
      appointmentId,
      customerId,
      preview: communicationLogTextPreview(text),
      hasPayloadData: communicationLogHasPayloadData(data),
      organizationId: this.organizationId,
      dateTime: new Date(),
      _id,
    });

    logger.debug({ logArgs, _id }, "Successfully logged new communication");
  }

  public async getCommunicationLogContent(
    logId: string,
    options?: { memberId?: string | string[] },
  ): Promise<CommunicationLogContentPayload | null> {
    const logger = this.loggerFactory("getCommunicationLogContent");
    const db = await getDbConnection();

    logger.debug({ logId, options }, "Getting communication log content");

    const filter: Filter<CommunicationLogEntity> = {
      _id: logId,
      organizationId: this.organizationId,
    };
    if (options?.memberId) {
      filter.memberId = {
        $in: Array.isArray(options.memberId)
          ? options.memberId
          : [options.memberId],
      };
    }

    const doc = await db
      .collection<CommunicationLogEntity>(LOG_COLLECTION_NAME)
      .findOne(filter);

    if (!doc) {
      logger.warn({ logId }, "Communication log not found");
      return null;
    }

    if (
      doc.text !== undefined ||
      doc.html !== undefined ||
      doc.data !== undefined
    ) {
      logger.debug({ logId }, "Using legacy inline content");
      return {
        text: doc.text ?? "",
        ...(doc.html !== undefined ? { html: doc.html } : {}),
        ...(doc.data !== undefined ? { data: doc.data } : {}),
      };
    }

    logger.debug({ logId }, "Getting communication log content from S3");
    const file = await this.assetsStorage.getFile(
      communicationLogPayloadFilename(logId),
    );

    if (!file) {
      logger.error({ logId }, "Communication log payload missing in storage");
      return null;
    }

    logger.debug({ logId }, "Parsing communication log content from S3");

    const raw = await stream2buffer(file.stream);
    logger.debug(
      { logId },
      "Successfully parsed communication log content from S3",
    );
    try {
      return JSON.parse(raw.toString("utf8")) as CommunicationLogContentPayload;
    } catch (error) {
      logger.error(
        { logId, error },
        "Failed to parse communication log payload",
      );
      logger.debug({ logId }, "Failed to parse communication log payload");
      return null;
    }
  }

  public async getCommunicationLogs(
    query: Query & {
      direction?: CommunicationDirection[];
      channel?: CommunicationChannel[];
      participantType?: CommunicationParticipantType[];
      range?: DateRange;
      customerId?: string | string[];
      appointmentId?: string;
      memberId?: string | string[];
    },
  ): Promise<WithTotal<CommunicationLog>> {
    const logger = this.loggerFactory("getCommunicationLogs");
    logger.debug({ query }, "Getting communication logs");

    const db = await getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { dateTime: -1 };

    const filter: Filter<CommunicationLogSearchable> = {
      organizationId: this.organizationId,
    };

    if (query.range?.start || query.range?.end) {
      filter.dateTime = {};

      if (query.range.start) {
        filter.dateTime.$gte = query.range.start;
      }

      if (query.range.end) {
        filter.dateTime.$lte = query.range.end;
      }
    }

    if (query.direction && query.direction.length) {
      filter.direction = {
        $in: query.direction,
      };
    }

    if (query.channel && query.channel.length) {
      filter.channel = {
        $in: query.channel,
      };
    }

    if (query.participantType && query.participantType.length) {
      filter.participantType = {
        $in: query.participantType,
      };
    }

    if (query.memberId) {
      filter.memberId = {
        $in: Array.isArray(query.memberId)
          ? query.memberId
          : [query.memberId],
      };
    }

    if (query.appointmentId) {
      filter.appointmentId = query.appointmentId;
    } else if (query.customerId) {
      filter["customer._id"] = {
        $in: Array.isArray(query.customerId)
          ? query.customerId
          : [query.customerId],
      };
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<CommunicationLogSearchable>(
        { $regex },
        "channel",
        "participant",
        "preview",
        "text",
        "appointment.option.name",
        "customer.name",
        "subject",
      );

      filter.$or = queries;
    }

    const [result] = await db
      .collection<CommunicationLogEntity>(LOG_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            organizationId: this.organizationId,
          },
        },
        {
          $lookup: {
            from: APPOINTMENTS_COLLECTION_NAME,
            localField: "appointmentId",
            foreignField: "_id",
            as: "appointment",
            pipeline: [
              {
                $match: {
                  organizationId: this.organizationId,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: CUSTOMERS_COLLECTION_NAME,
            localField: "customerId",
            foreignField: "_id",
            as: "customer",
            pipeline: [
              {
                $match: {
                  organizationId: this.organizationId,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: MEMBERS_COLLECTION_NAME,
            localField: "memberId",
            foreignField: "_id",
            as: "member",
            pipeline: [
              {
                $match: {
                  organizationId: this.organizationId,
                },
              },
            ],
          },
        },
        {
          $set: {
            appointment: {
              $first: "$appointment",
            },
            customer: {
              $first: "$customer",
            },
            member: {
              $first: "$member",
            },
          },
        },
        {
          $lookup: {
            from: "customers",
            localField: "appointment.customerId",
            foreignField: "_id",
            as: "appointmentCustomer",
            pipeline: [
              {
                $match: {
                  organizationId: this.organizationId,
                },
              },
            ],
          },
        },
        {
          $set: {
            customer: {
              $ifNull: ["$customer", { $first: "$appointmentCustomer" }],
            },
          },
        },
        {
          $unset: "appointmentCustomer",
        },
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

    const rawItems = (result.paginatedResults ||
      []) as (CommunicationLogEntity & {
      appointment?: CommunicationLog["appointment"];
      customer?: CommunicationLog["customer"];
    })[];

    const items = rawItems.map((row) => this.toListRow(row));

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items,
    };

    logger.debug(
      {
        query,
        result: { total: response.total, count: response.items.length },
      },
      "Fetched communication logs",
    );

    return response;
  }

  private toListRow(
    doc: CommunicationLogEntity & {
      appointment?: CommunicationLog["appointment"];
      customer?: CommunicationLog["customer"];
    },
  ): CommunicationLog {
    const { text, html, data, appointment, customer, ...meta } = doc;
    const preview =
      doc.preview ??
      communicationLogTextPreview(typeof text === "string" ? text : "");
    const hasPayloadData =
      doc.hasPayloadData ?? communicationLogHasPayloadData(data);

    return {
      ...meta,
      preview,
      hasPayloadData,
      appointment,
      customer,
    };
  }

  public async clearAllLogs() {
    const logger = this.loggerFactory("clearAllLogs");
    logger.debug("Clearing all logs");

    const db = await getDbConnection();
    const collection =
      db.collection<CommunicationLogEntity>(LOG_COLLECTION_NAME);

    const ids = await collection
      .find({ organizationId: this.organizationId })
      .project<{ _id: string }>({ _id: 1 })
      .map((d) => d._id)
      .toArray();

    logger.debug({ ids }, "Deleting payload files");
    await this.deletePayloadFiles(ids);

    logger.debug({ ids }, "Deleting logs");
    const { deletedCount } = await collection.deleteMany({
      organizationId: this.organizationId,
    });

    logger.debug({ deletedCount }, "Cleared all logs");
  }

  public async clearSelectedLogs(ids: string[]) {
    const logger = this.loggerFactory("clearSelectedLogs");
    logger.debug({ ids }, "Clearing selected logs");
    const db = await getDbConnection();
    const collection =
      db.collection<CommunicationLogEntity>(LOG_COLLECTION_NAME);

    logger.debug({ ids }, "Deleting payload files");
    await this.deletePayloadFiles(ids);

    logger.debug({ ids }, "Deleting logs");
    const { deletedCount } = await collection.deleteMany({
      _id: {
        $in: ids,
      },
      organizationId: this.organizationId,
    });

    logger.debug({ ids, deletedCount }, "Cleared selected logs");
  }

  public async clearOldLogs(maxDate: Date) {
    const logger = this.loggerFactory("clearOldLogs");
    logger.debug({ maxDate }, "Clearing old logs");
    const db = await getDbConnection();
    const collection =
      db.collection<CommunicationLogEntity>(LOG_COLLECTION_NAME);

    logger.debug({ maxDate }, "Finding old logs");
    const ids = await collection
      .find({
        dateTime: {
          $lt: maxDate,
        },
        organizationId: this.organizationId,
      })
      .project<{ _id: string }>({ _id: 1 })
      .map((d) => d._id)
      .toArray();

    logger.debug({ maxDate, ids }, "Deleting payload files");
    await this.deletePayloadFiles(ids);

    logger.debug({ maxDate }, "Deleting logs");
    const { deletedCount } = await collection.deleteMany({
      dateTime: {
        $lt: maxDate,
      },
      organizationId: this.organizationId,
    });

    logger.debug({ maxDate, deletedCount }, "Cleared old logs");
  }

  private async deletePayloadFiles(ids: string[]) {
    const logger = this.loggerFactory("deletePayloadFiles");
    if (!ids.length) {
      logger.debug({ ids }, "No payload files to delete");
      return;
    }

    logger.debug({ fileCount: ids.length }, "Deleting payload files");
    await this.assetsStorage.deleteFiles(
      ids.map(communicationLogPayloadFilename),
    );

    logger.debug(
      { fileCount: ids.length },
      "Successfully deleted payload files",
    );
  }
}
