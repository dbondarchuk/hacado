import { getDbClient, getDbConnection } from "./database";

import {
  Asset,
  ASSET_CREATED_EVENT_TYPE,
  ASSET_DELETED_EVENT_TYPE,
  ASSET_UPDATED_EVENT_TYPE,
  AssetEntity,
  AssetTotalSizeLimitReachedError,
  AssetUpdate,
  BillingPlanTier,
  FREE_TIER_LIMITS,
  IAssetsService,
  IAssetsStorage,
  IConfigurationService,
  IEventService,
  IOrganizationService,
  Query,
  WithTotal,
  type AssetCreatedPayload,
  type AssetDeletedPayload,
  type AssetUpdatedPayload,
  type EventSource,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex } from "@hacado/utils";
import { createHash } from "crypto";
import { DateTime } from "luxon";
import { ClientSession, Filter, ObjectId, Sort } from "mongodb";
import { Readable } from "stream";
import { resolvePlanTierFromOrganization } from "./billing/subscription-entitlements";
import { BaseService } from "./services/base.service";

import {
  APPOINTMENTS_COLLECTION_NAME,
  ASSETS_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
} from "./collections";

async function getFileHash(file: File): Promise<string> {
  const hash = createHash("sha256");

  // Convert the file.stream() (Web ReadableStream) into a Node stream
  const nodeStream = Readable.fromWeb(file.stream() as any);

  return new Promise<string>((resolve, reject) => {
    nodeStream.on("data", (chunk) => hash.update(chunk));
    nodeStream.on("end", () => resolve(hash.digest("hex")));
    nodeStream.on("error", reject);
  });
}

export class AssetsService extends BaseService implements IAssetsService {
  public constructor(
    organizationId: string,
    protected readonly configurationService: IConfigurationService,
    protected readonly storage: IAssetsStorage,
    protected readonly eventService: IEventService,
    private readonly organizationService: IOrganizationService,
  ) {
    super("AssetsService", organizationId);
  }

  private async assertFreeTierAssetsTotalLimit(
    nextFileSizeBytes: number,
    session?: ClientSession,
  ): Promise<void> {
    const logger = this.loggerFactory("assertFreeTierAssetsTotalLimit");
    logger.debug(
      { nextFileSizeBytes },
      "Asserting free tier assets total limit",
    );

    const organization = await this.organizationService.getOrganization();
    const planTier = resolvePlanTierFromOrganization(organization);
    if (planTier !== BillingPlanTier.Free) {
      logger.debug(
        "Free tier assets total limit not enforced for non-free plan tier",
      );
      return;
    }

    const db = await getDbConnection();
    const [res] = await db
      .collection<AssetEntity>(ASSETS_COLLECTION_NAME)
      .aggregate(
        [
          { $match: { organizationId: this.organizationId } },
          { $group: { _id: null, total: { $sum: "$size" } } },
        ],
        session ? { session } : undefined,
      )
      .toArray();

    const totalBytes = (res?.total as number | undefined) ?? 0;
    if (totalBytes + nextFileSizeBytes > FREE_TIER_LIMITS.assetsTotalSize) {
      logger.error(
        { totalBytes, nextFileSizeBytes },
        "Free tier assets total limit reached",
      );
      throw new AssetTotalSizeLimitReachedError(
        FREE_TIER_LIMITS.assetsTotalSize,
      );
    }

    logger.debug(
      { totalBytes, nextFileSizeBytes },
      "Free tier assets total limit not reached",
    );
  }

  public async getAsset(id: string): Promise<Asset | null> {
    const logger = this.loggerFactory("getAsset");
    logger.debug({ assetId: id }, "Getting asset by id");

    const db = await getDbConnection();
    const assets = db.collection<AssetEntity>(ASSETS_COLLECTION_NAME);

    const asset = (await assets
      .aggregate([
        {
          $match: {
            _id: id,
            organizationId: this.organizationId,
          },
        },
        ...this.aggregateJoin,
      ])
      .next()) as Asset | null;

    if (!asset) {
      logger.warn({ assetId: id }, "Asset not found");
    } else {
      logger.debug(
        {
          assetId: id,
          fileName: asset.filename,
          fileSize: asset.size,
          fileType: asset.mimeType,
        },
        "Asset found",
      );
    }

    return asset;
  }

  public async getAssets(
    query: Query & {
      accept?: string[];
      customerId?: string | string[];
      appointmentId?: string | string[];
      appId?: string;
    },
  ): Promise<WithTotal<Asset>> {
    const logger = this.loggerFactory("getAssets");
    logger.debug({ query }, "Getting assets with query");

    const db = await getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { uploadedAt: -1 };

    const filter: Filter<Asset> = {
      organizationId: this.organizationId,
    };

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<Asset>(
        { $regex },
        "filename",
        "mimeType",
        "description",
      );

      filter.$or = queries;
    }

    if (query.accept?.length) {
      filter.$and = [
        {
          $or: query.accept
            .filter((accept) => !!accept)
            .map((accept) => ({
              mimeType: {
                $regex: `^${accept.replaceAll("*", ".*")}$`,
              },
            })),
        },
      ];
    }

    if (query.customerId) {
      filter["customer._id"] = {
        $in: Array.isArray(query.customerId)
          ? query.customerId
          : [query.customerId],
      };
    }

    if (query.appointmentId) {
      filter.appointmentId = {
        $in: Array.isArray(query.appointmentId)
          ? query.appointmentId
          : [query.appointmentId],
      };
    }

    const [res] = await db
      .collection<AssetEntity>(ASSETS_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            organizationId: this.organizationId,
          },
        },
        ...this.aggregateJoin,
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

    const result = {
      total: res.totalCount?.[0]?.count || 0,
      items: res.paginatedResults || [],
    };

    logger.debug(
      {
        query,
        total: result.total,
        count: result.items.length,
      },
      "Successfully retrieved assets",
    );

    return result;
  }

  public async createAsset(
    asset: Omit<Asset, "_id" | "uploadedAt" | "size" | "hash">,
    file: File,
    source: EventSource,
  ): Promise<AssetEntity> {
    const args = {
      fileName: asset.filename,
      mimeType: asset.mimeType,
      size: file.size,
      hash: undefined as string | undefined,
    };

    const logger = this.loggerFactory("createAsset");
    logger.debug({ args }, "Creating new asset");

    const db = await getDbConnection();
    const dbClient = await getDbClient();

    const session = dbClient.startSession();
    try {
      return await session.withTransaction(async () => {
        const assets = db.collection<AssetEntity>(ASSETS_COLLECTION_NAME);
        const filename = asset.filename.replace(/ /g, "_");

        const existing = await assets.findOne({
          filename,
          organizationId: this.organizationId,
        });

        if (!!existing) {
          logger.error(args, "Asset with such file name already exists");
          throw new Error(`File '${filename}' already exists`);
        }

        const hash = await getFileHash(file);
        args.hash = hash;
        const existingWithSameHash = await assets.findOne({
          hash,
          appointmentId: asset.appointmentId,
          customerId: asset.customerId,
          organizationId: this.organizationId,
        });

        if (!!existingWithSameHash) {
          logger.info(args, "Asset with such hash already exists");
          return existingWithSameHash;
        }

        await this.assertFreeTierAssetsTotalLimit(file.size, session);

        logger.debug(args, "Uploading new asset");

        await this.storage.saveFile(
          filename,
          Readable.fromWeb(file.stream() as any),
          file.size,
        );

        logger.debug(args, "Saving new asset");

        const dbAsset: Asset = {
          ...asset,
          filename,
          organizationId: this.organizationId,
          _id: new ObjectId().toString(),
          uploadedAt: DateTime.utc().toJSDate(),
          size: file.size,
          hash,
        };

        await assets.insertOne(dbAsset);

        await this.eventService.emit(
          ASSET_CREATED_EVENT_TYPE,
          { asset: dbAsset } satisfies AssetCreatedPayload,
          source,
        );

        logger.debug(args, "Asset successfully created");

        return dbAsset;
      });
    } finally {
      await session.endSession();
    }
  }

  public async updateAsset(
    assetId: string,
    update: AssetUpdate,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updateAsset");
    logger.debug({ assetId }, "Updating asset");

    const db = await getDbConnection();
    const assets = db.collection<AssetEntity>(ASSETS_COLLECTION_NAME);

    const { _id, filename, uploadedAt, mimeType, ...updateObj } =
      update as Asset; // Remove fields in case it slips here

    await assets.updateOne(
      {
        _id: assetId,
        organizationId: this.organizationId,
      },
      {
        $set: updateObj,
      },
    );

    const asset = await this.getAsset(assetId);
    if (asset) {
      await this.eventService.emit(
        ASSET_UPDATED_EVENT_TYPE,
        { asset, update: updateObj } satisfies AssetUpdatedPayload,
        source,
      );
    }

    logger.debug({ assetId }, "Asset was successfully updated");
  }

  public async deleteAsset(
    assetId: string,
    source: EventSource,
  ): Promise<Asset | null> {
    const logger = this.loggerFactory("deleteAsset");
    logger.debug({ assetId }, "Deleting asset");

    const db = await getDbConnection();
    const dbClient = await getDbClient();

    const session = dbClient.startSession();
    try {
      return await session.withTransaction(async () => {
        const assets = db.collection<Asset>(ASSETS_COLLECTION_NAME);

        const asset = await assets.findOneAndDelete({
          _id: assetId,
          organizationId: this.organizationId,
        });
        if (!asset) {
          logger.warn({ assetId }, "Asset not found");
          return null;
        }

        logger.debug(
          { assetId, fileName: asset.filename },
          "Asset deleted. Deleting file",
        );

        await this.storage.deleteFile(asset.filename);
        logger.debug({ assetId, fileName: asset.filename }, "File deleted");

        await this.eventService.emit(
          ASSET_DELETED_EVENT_TYPE,
          { assetIds: [assetId] } satisfies AssetDeletedPayload,
          source,
        );

        return asset;
      });
    } finally {
      await session.endSession();
    }
  }

  public async deleteAssets(
    assetsIds: string[],
    source: EventSource,
  ): Promise<Asset[]> {
    const logger = this.loggerFactory("deleteAssets");
    logger.debug({ assetsIds }, "Deleting assets");

    const db = await getDbConnection();
    const dbClient = await getDbClient();

    const session = dbClient.startSession();
    try {
      return await session.withTransaction(async () => {
        const assets = db.collection<AssetEntity>(ASSETS_COLLECTION_NAME);

        const toRemove = await assets
          .find({
            _id: {
              $in: assetsIds,
            },
            organizationId: this.organizationId,
          })
          .toArray();

        const { deletedCount } = await assets.deleteMany({
          _id: {
            $in: assetsIds,
          },
          organizationId: this.organizationId,
        });

        logger.debug(
          { assetsIds, deletedCount },
          "Assets deleted. Deleting files",
        );

        await this.storage.deleteFiles(toRemove.map((asset) => asset.filename));

        logger.debug({ assetsIds, deletedCount }, "Files deleted");

        if (toRemove.length) {
          await this.eventService.emit(
            ASSET_DELETED_EVENT_TYPE,
            {
              assetIds: toRemove.map((a) => a._id),
            } satisfies AssetDeletedPayload,
            source,
          );
        }

        return toRemove;
      });
    } finally {
      await session.endSession();
    }
  }

  public async checkUniqueFileName(
    filename: string,
    _id?: string,
  ): Promise<boolean> {
    const logger = this.loggerFactory("checkUniqueFileName");
    logger.debug({ filename, _id }, "Checking if file name is unqiue");

    const db = await getDbConnection();
    const assets = db.collection<AssetEntity>(ASSETS_COLLECTION_NAME);

    const filter: Filter<AssetEntity> = {
      filename,
      organizationId: this.organizationId,
    };

    if (_id) {
      filter._id = {
        $ne: _id,
      };
    }

    const hasNext = await assets
      .aggregate([
        {
          $match: filter,
        },
      ])
      .hasNext();

    logger.debug(
      { filename, _id },
      `File name is${hasNext ? " not" : ""} unqiue`,
    );

    return !hasNext;
  }

  public async streamAsset(
    filename: string,
  ): Promise<{ stream: Readable; asset: AssetEntity } | null> {
    const logger = this.loggerFactory("streamAsset");
    logger.info({ filename }, "Streaming asset");

    const db = await getDbConnection();
    const assets = db.collection<AssetEntity>(ASSETS_COLLECTION_NAME);

    const asset = await assets.findOne({
      filename,
      organizationId: this.organizationId,
    });

    if (!asset) {
      logger.warn({ filename }, "Asset not found");
      return null;
    }

    logger.debug(
      { filename, assetId: asset._id, size: asset.size },
      "Found asset, streaming it.",
    );

    const result = await this.storage.getFile(filename);
    if (!result) {
      logger.warn({ filename }, "File not found");
      return null;
    }

    return { stream: result.stream, asset };
  }

  private get aggregateJoin() {
    return [
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
        $set: {
          appointment: {
            $first: "$appointment",
          },
          customer: {
            $first: "$customer",
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
    ];
  }
}
