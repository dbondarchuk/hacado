import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  IConnectedAppProps,
  inPersonPaymentMethod,
  WithTotal,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex } from "@hacado/utils";
import { ObjectId, type Filter, type Sort } from "mongodb";
import {
  DesignListModel,
  DesignModel,
  DesignUpdateModel,
  GetDesignsQuery,
  GIFT_CARD_DESIGNS_COLLECTION_NAME,
} from "../models/design";
import {
  GetPurchasedGiftCardsQuery,
  PURCHASED_GIFT_CARDS_COLLECTION_NAME,
  PurchasedGiftCardListModel,
  PurchasedGiftCardModel,
} from "../models/purchased-gift-card";

/** Must match `@hacado/services/collections` — avoid importing services (circular dep). */
const CUSTOMERS_COLLECTION_NAME = "customers";

export class GiftCardStudioRepositoryService {
  protected readonly loggerFactory: LoggerFactory;

  public constructor(
    protected readonly appId: string,
    protected readonly organizationId: string,
    protected readonly getDbConnection: IConnectedAppProps["getDbConnection"],
    protected readonly services: IConnectedAppProps["services"],
  ) {
    this.loggerFactory = getLoggerFactory(
      "GiftCardStudioRepositoryService",
      this.organizationId,
    );
  }

  public async createDesign(design: DesignUpdateModel): Promise<DesignModel> {
    const logger = this.loggerFactory("createDesign");
    logger.debug({ design }, "Creating design");

    const db = await this.getDbConnection();
    const entity: DesignModel = {
      ...design,
      _id: new ObjectId().toString(),
      appId: this.appId,
      organizationId: this.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db
      .collection<DesignModel>(GIFT_CARD_DESIGNS_COLLECTION_NAME)
      .insertOne(entity);

    logger.debug({ entity }, "Design created");
    return entity;
  }

  public async updateDesign(
    id: string,
    design: DesignUpdateModel,
  ): Promise<DesignModel | null> {
    const logger = this.loggerFactory("updateDesign");
    logger.debug({ id, design }, "Updating design");

    const db = await this.getDbConnection();
    const { modifiedCount } = await db
      .collection<DesignModel>(GIFT_CARD_DESIGNS_COLLECTION_NAME)
      .updateOne(
        { _id: id, organizationId: this.organizationId, appId: this.appId },
        {
          $set: {
            ...design,
            updatedAt: new Date(),
          },
        },
      );

    if (modifiedCount === 0) {
      logger.warn({ id }, "Design not found");
      return null;
    }

    return this.getDesignById(id);
  }

  public async setDesignArchived(
    id: string,
    isArchived: boolean,
  ): Promise<boolean> {
    const logger = this.loggerFactory("setDesignArchived");
    logger.debug({ id, isArchived }, "Setting design archived");

    const db = await this.getDbConnection();
    const { modifiedCount } = await db
      .collection<DesignModel>(GIFT_CARD_DESIGNS_COLLECTION_NAME)
      .updateOne(
        { _id: id, organizationId: this.organizationId, appId: this.appId },
        { $set: { updatedAt: new Date(), isArchived } },
      );

    if (modifiedCount === 0) {
      logger.warn({ id }, "Design not found");
      return false;
    }

    logger.debug({ id, isArchived }, "Design archived updated");
    return true;
  }

  public async setDesignsArchived(
    ids: string[],
    isArchived: boolean,
  ): Promise<boolean> {
    const logger = this.loggerFactory("setDesignsArchived");
    logger.debug({ ids, isArchived }, "Setting designs archived");

    const db = await this.getDbConnection();
    const { modifiedCount } = await db
      .collection<DesignModel>(GIFT_CARD_DESIGNS_COLLECTION_NAME)
      .updateMany(
        {
          _id: { $in: ids },
          organizationId: this.organizationId,
          appId: this.appId,
        },
        { $set: { updatedAt: new Date(), isArchived } },
      );

    if (modifiedCount === 0) {
      logger.warn({ ids }, "Designs not found");
      return false;
    }

    logger.debug({ ids, isArchived }, "Designs archived updated");
    return true;
  }

  public async getDesigns(
    query: GetDesignsQuery,
  ): Promise<WithTotal<DesignListModel>> {
    const logger = this.loggerFactory("getDesigns");
    logger.debug({ query }, "Getting designs");

    const db = await this.getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { createdAt: -1 };

    const $and: Filter<DesignModel>[] = [
      {
        organizationId: this.organizationId,
        appId: this.appId,
      },
    ];

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      $and.push({ name: { $regex } } as Filter<DesignModel>);
    }

    if (query.isArchived?.length) {
      const hasFalse = query.isArchived.includes(false);
      const hasTrue = query.isArchived.includes(true);
      if (hasFalse && hasTrue) {
        // no filter – show all
      } else if (hasFalse) {
        $and.push({
          isArchived: { $ne: true },
        });
      } else {
        $and.push({ isArchived: true });
      }
    }

    const filter: Filter<DesignModel> =
      $and.length > 0 ? ({ $and } as Filter<DesignModel>) : {};

    const [result] = await db
      .collection<DesignModel>(GIFT_CARD_DESIGNS_COLLECTION_NAME)
      .aggregate([
        {
          $lookup: {
            from: PURCHASED_GIFT_CARDS_COLLECTION_NAME,
            localField: "_id",
            foreignField: "designId",
            as: "purchases",
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
            purchasesCount: { $size: "$purchases" },
          },
        },
        { $unset: ["purchases"] },
        ...(query.priorityIds?.length
          ? [
              {
                $facet: {
                  priority: [
                    {
                      $match: {
                        _id: { $in: query.priorityIds },
                        organizationId: this.organizationId,
                      },
                    },
                  ],
                  other: [
                    { $match: { ...filter, _id: { $nin: query.priorityIds } } },
                    { $sort: sort },
                  ],
                },
              },
              {
                $project: {
                  values: { $concatArrays: ["$priority", "$other"] },
                },
              },
              { $unwind: "$values" },
              { $replaceRoot: { newRoot: "$values" } },
            ]
          : [{ $match: filter }, { $sort: sort }]),
        { $unset: ["design"] },
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
            totalCount: [{ $count: "count" }],
          },
        },
      ])
      .toArray();

    const response: WithTotal<DesignListModel> = {
      total: result?.totalCount?.[0]?.count || 0,
      items: result?.paginatedResults || [],
    };

    logger.debug(
      {
        result: { total: response.total, count: response.items.length },
        query,
      },
      "Fetched designs",
    );
    return response;
  }

  public async getDesignById(id: string): Promise<DesignModel | null> {
    const logger = this.loggerFactory("getDesignById");
    logger.debug({ id }, "Getting design");

    const db = await this.getDbConnection();
    const design = await db
      .collection<DesignModel>(GIFT_CARD_DESIGNS_COLLECTION_NAME)
      .findOne({
        _id: id,
        organizationId: this.organizationId,
        appId: this.appId,
      });

    if (!design) {
      logger.warn({ id }, "Design not found");
      return null;
    }
    return design;
  }

  public async deleteDesign(id: string): Promise<boolean> {
    const logger = this.loggerFactory("deleteDesign");
    logger.debug({ id }, "Deleting design");

    const db = await this.getDbConnection();

    const hasPurchases = await db
      .collection<PurchasedGiftCardModel>(PURCHASED_GIFT_CARDS_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            designId: id,
            organizationId: this.organizationId,
            appId: this.appId,
          },
        },
      ])
      .hasNext();

    if (hasPurchases) {
      logger.warn({ id }, "Design has purchases, cannot delete");
      return false;
    }

    const { deletedCount } = await db
      .collection<DesignModel>(GIFT_CARD_DESIGNS_COLLECTION_NAME)
      .deleteOne({
        _id: id,
        organizationId: this.organizationId,
        appId: this.appId,
      });

    if (deletedCount === 0) {
      logger.warn({ id }, "Design not found");
      return false;
    }

    logger.debug({ id }, "Design deleted");
    return true;
  }

  public async deleteDesigns(ids: string[]): Promise<boolean> {
    const logger = this.loggerFactory("deleteDesigns");
    logger.debug({ ids }, "Deleting designs");

    const db = await this.getDbConnection();
    const hasPurchases = await db
      .collection<PurchasedGiftCardModel>(PURCHASED_GIFT_CARDS_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            designId: { $in: ids },
            organizationId: this.organizationId,
            appId: this.appId,
          },
        },
      ])
      .hasNext();

    if (hasPurchases) {
      logger.warn({ ids }, "Designs have purchases, cannot delete");
      return false;
    }

    const { deletedCount } = await db
      .collection<DesignModel>(GIFT_CARD_DESIGNS_COLLECTION_NAME)
      .deleteMany({
        _id: { $in: ids },
        organizationId: this.organizationId,
        appId: this.appId,
      });

    if (deletedCount !== ids.length) {
      logger.warn({ ids, deletedCount }, "Not all designs were removed");
    }

    logger.debug({ ids }, "Designs deleted");
    return true;
  }

  public async checkDesignNameUnique(
    name: string,
    id?: string,
  ): Promise<boolean> {
    const logger = this.loggerFactory("checkDesignNameUnique");
    logger.debug({ name, id }, "Checking design name uniqueness");

    const db = await this.getDbConnection();
    const filter: Filter<DesignModel> = {
      name,
      organizationId: this.organizationId,
      appId: this.appId,
    };
    if (id) {
      filter._id = { $ne: id };
    }

    const hasNext = await db
      .collection<DesignModel>(GIFT_CARD_DESIGNS_COLLECTION_NAME)
      .aggregate([{ $match: filter }])
      .hasNext();

    const result = !hasNext;
    logger.debug({ name, id, result }, "Design name uniqueness check result");
    return result;
  }

  public async createPurchasedGiftCard(
    doc: Omit<
      PurchasedGiftCardModel,
      "_id" | "createdAt" | "updatedAt" | "appId" | "organizationId"
    >,
  ): Promise<PurchasedGiftCardModel> {
    const logger = this.loggerFactory("createPurchasedGiftCard");
    logger.debug({ doc }, "Creating purchased gift card");

    const db = await this.getDbConnection();
    const entity: PurchasedGiftCardModel = {
      ...doc,
      _id: new ObjectId().toString(),
      appId: this.appId,
      organizationId: this.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db
      .collection<PurchasedGiftCardModel>(PURCHASED_GIFT_CARDS_COLLECTION_NAME)
      .insertOne(entity);

    logger.debug({ id: entity._id }, "Purchased gift card created");
    return entity;
  }

  public async updatePurchasedGiftCardStatus(
    id: string,
    update: Partial<
      Pick<
        PurchasedGiftCardModel,
        | "cardGenerationStatus"
        | "invoiceGenerationStatus"
        | "recipientDeliveryStatus"
        | "customerDeliveryStatus"
      >
    >,
  ): Promise<PurchasedGiftCardModel | null> {
    const logger = this.loggerFactory("updatePurchasedGiftCard");
    logger.debug({ id, update }, "Updating purchased gift card");

    const db = await this.getDbConnection();
    const { modifiedCount } = await db
      .collection<PurchasedGiftCardModel>(PURCHASED_GIFT_CARDS_COLLECTION_NAME)
      .updateOne(
        { _id: id, organizationId: this.organizationId, appId: this.appId },
        { $set: { ...update, updatedAt: new Date() } },
      );

    if (modifiedCount === 0) {
      logger.warn({ id }, "Purchased gift card not found");
      return null;
    }
    return this.getPurchasedGiftCardById(id);
  }

  public async getCustomerPurchasesCountSince(since: Date): Promise<number> {
    const db = await this.getDbConnection();
    return db
      .collection<PurchasedGiftCardModel>(PURCHASED_GIFT_CARDS_COLLECTION_NAME)
      .countDocuments({
        organizationId: this.organizationId,
        appId: this.appId,
        purchaseChannel: "customer",
        createdAt: { $gt: since },
      });
  }

  public async getPurchasedGiftCards(
    query: GetPurchasedGiftCardsQuery,
  ): Promise<WithTotal<PurchasedGiftCardListModel>> {
    const logger = this.loggerFactory("getPurchasedGiftCards");
    logger.debug({ query }, "Getting purchased gift cards");

    const db = await this.getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { createdAt: -1 };

    const $and: Filter<PurchasedGiftCardListModel>[] = [
      {
        organizationId: this.organizationId,
        appId: this.appId,
      },
    ];

    if (query.designId) {
      $and.push({
        designId: {
          $in: Array.isArray(query.designId)
            ? query.designId
            : [query.designId],
        },
      });
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

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<PurchasedGiftCardListModel>(
        { $regex },
        "toName",
        "toEmail",
        "giftCardCode",
        "designName",
        "customer.name",
        "customer.phone",
        "customer.email",
        "customer.knownNames",
        "customer.knownEmails",
        "customer.knownPhones",
        "customer.note",
      );

      $and.push({ $or: queries });
    }

    const filter: Filter<PurchasedGiftCardListModel> =
      $and.length > 0 ? ({ $and } as Filter<PurchasedGiftCardListModel>) : {};

    const [result] = await db
      .collection<PurchasedGiftCardListModel>(
        PURCHASED_GIFT_CARDS_COLLECTION_NAME,
      )
      .aggregate([
        {
          $lookup: {
            from: "customers",
            localField: "customerId",
            foreignField: "_id",
            as: "customers",
            pipeline: [{ $match: { organizationId: this.organizationId } }],
          },
        },
        {
          $lookup: {
            from: GIFT_CARD_DESIGNS_COLLECTION_NAME,
            localField: "designId",
            foreignField: "_id",
            as: "designs",
          },
        },
        {
          $lookup: {
            from: "gift-cards",
            localField: "giftCardId",
            foreignField: "_id",
            as: "giftCards",
            pipeline: [{ $match: { organizationId: this.organizationId } }],
          },
        },
        {
          $set: {
            customer: { $first: "$customers" },
            designName: { $first: "$designs.name" },
            giftCardCode: { $first: "$giftCards.code" },
            paymentId: { $first: "$giftCards.paymentId" },
            status: { $first: "$giftCards.status" },
          },
        },
        {
          $lookup: {
            from: "payments",
            localField: "paymentId",
            foreignField: "_id",
            as: "payments",
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
            from: "payments",
            localField: "giftCardId",
            foreignField: "giftCardId",
            as: "giftCardPayments",
            pipeline: [
              {
                $match: {
                  organizationId: this.organizationId,
                  method: "gift-card",
                },
              },
            ],
          },
        },
        {
          $set: {
            paymentMethod: { $first: "$payments.method" },
            paymentsCount: { $size: "$giftCardPayments" },
          },
        },
        {
          $unset: [
            "designs",
            "customers",
            "giftCards",
            "payments",
            "giftCardPayments",
          ],
        },
        { $match: filter },
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
            totalCount: [{ $count: "count" }],
          },
        },
      ])
      .toArray();

    const items = (result?.paginatedResults ||
      []) as PurchasedGiftCardListModel[];
    const total = result?.totalCount?.[0]?.count || 0;

    logger.debug(
      { result: { total, count: items.length }, query },
      "Fetched purchased gift cards",
    );
    return { total, items };
  }

  public async getPurchasedGiftCardReadyToSendEmails(
    id: string,
    type: "customer" | "recipient",
  ): Promise<PurchasedGiftCardModel | null> {
    const logger = this.loggerFactory("getPurchasedGiftCardReadyToSendEmails");
    logger.debug(
      { id, type },
      "Atomicly checking if purchased gift card is ready to send emails and set delivery status",
    );

    const db = await this.getDbConnection();
    const filter: Filter<PurchasedGiftCardModel> = {
      _id: id,
      organizationId: this.organizationId,
      appId: this.appId,
      cardGenerationStatus: "completed",
      [type === "customer"
        ? "customerDeliveryStatus"
        : "recipientDeliveryStatus"]: "pending",
    };

    if (type === "customer") {
      filter.invoiceGenerationStatus = "completed";
    }

    const result = await db
      .collection<PurchasedGiftCardModel>(PURCHASED_GIFT_CARDS_COLLECTION_NAME)
      .findOneAndUpdate(
        filter,
        {
          $set: {
            updatedAt: new Date(),
            [type === "customer"
              ? "customerDeliveryStatus"
              : "recipientDeliveryStatus"]: "scheduled",
          },
        },
        { returnDocument: "after" },
      );

    if (!result) {
      logger.warn({ id, type }, "Purchased gift card not ready to send emails");
      return null;
    }

    logger.debug(
      { id, type },
      "Purchased gift card ready to send emails and delivery status set",
    );
    return result;
  }

  public async getPurchasedGiftCardById(
    id: string,
  ): Promise<PurchasedGiftCardListModel | null> {
    const logger = this.loggerFactory("getPurchasedGiftCardById");
    logger.debug({ id }, "Getting purchased gift card");

    const db = await this.getDbConnection();
    const [doc] = await db
      .collection<PurchasedGiftCardListModel>(
        PURCHASED_GIFT_CARDS_COLLECTION_NAME,
      )
      .aggregate([
        {
          $match: {
            _id: id,
            organizationId: this.organizationId,
            appId: this.appId,
          },
        },
        {
          $lookup: {
            from: CUSTOMERS_COLLECTION_NAME,
            localField: "customerId",
            foreignField: "_id",
            as: "customers",
            pipeline: [{ $match: { organizationId: this.organizationId } }],
          },
        },
        {
          $lookup: {
            from: GIFT_CARD_DESIGNS_COLLECTION_NAME,
            localField: "designId",
            foreignField: "_id",
            as: "designs",
          },
        },
        {
          $lookup: {
            from: "gift-cards",
            localField: "giftCardId",
            foreignField: "_id",
            as: "giftCards",
            pipeline: [{ $match: { organizationId: this.organizationId } }],
          },
        },
        {
          $set: {
            customer: { $first: "$customers" },
            designName: { $first: "$designs.name" },
            giftCardCode: { $first: "$giftCards.code" },
            paymentId: { $first: "$giftCards.paymentId" },
            status: { $first: "$giftCards.status" },
          },
        },
        {
          $lookup: {
            from: "payments",
            localField: "paymentId",
            foreignField: "_id",
            as: "payments",
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
            from: "payments",
            localField: "giftCardId",
            foreignField: "giftCardId",
            as: "giftCardPayments",
            pipeline: [
              {
                $match: {
                  organizationId: this.organizationId,
                  method: "gift-card",
                },
              },
            ],
          },
        },
        {
          $set: {
            paymentMethod: { $first: "$payments.method" },
            paymentsCount: { $size: "$giftCardPayments" },
          },
        },
        {
          $unset: [
            "designs",
            "customers",
            "giftCards",
            "payments",
            "giftCardPayments",
          ],
        },
      ])
      .toArray();

    if (!doc) {
      logger.warn({ id }, "Purchased gift card not found");
      return null;
    }

    return doc as PurchasedGiftCardListModel;
  }

  public async deletePurchasedGiftCard(
    id: string,
  ): Promise<PurchasedGiftCardModel | null> {
    const logger = this.loggerFactory("deletePurchasedGiftCard");
    logger.debug({ id }, "Deleting purchased gift card");

    const db = await this.getDbConnection();
    const giftCard = await this.getPurchasedGiftCardById(id);
    if (!giftCard) {
      logger.warn({ id }, "Purchased gift card not found");
      return null;
    }

    if (
      !(inPersonPaymentMethod as readonly string[]).includes(
        giftCard.paymentMethod,
      )
    ) {
      logger.warn(
        { id, paymentMethod: giftCard.paymentMethod },
        "Purchased gift card payment method is not an in-person payment method",
      );
      return null;
    }

    const deletedGiftCard = await this.services.giftCardsService.deleteGiftCard(
      giftCard.giftCardId,
      { actor: "system" },
      this.appId,
    );
    if (!deletedGiftCard) {
      logger.warn({ id }, "Failed to delete gift card");
      return null;
    }

    const { deletedCount } = await db
      .collection<PurchasedGiftCardModel>(PURCHASED_GIFT_CARDS_COLLECTION_NAME)
      .deleteOne({
        _id: id,
        organizationId: this.organizationId,
        appId: this.appId,
      });

    if (deletedCount === 0) {
      logger.warn({ id }, "Purchased gift card not found");
      return null;
    }

    return giftCard;
  }

  public async install(): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug("Installing Gift Card Studio app");

    const db = await this.getDbConnection();

    try {
      await db.createCollection(GIFT_CARD_DESIGNS_COLLECTION_NAME);
      const designsCollection = db.collection(
        GIFT_CARD_DESIGNS_COLLECTION_NAME,
      );

      const designIndexes: Record<string, Record<string, 1>> = {
        organizationId_appId_1: { organizationId: 1, appId: 1 },
        organizationId_appId_isArchived_1: {
          organizationId: 1,
          appId: 1,
          isArchived: 1,
        },
        organizationId_appId_name_1: { organizationId: 1, appId: 1, name: 1 },
        organizationId_appId_createdAt_1: {
          organizationId: 1,
          appId: 1,
          createdAt: 1,
        },
      };

      for (const [name, index] of Object.entries(designIndexes)) {
        if (!(await designsCollection.indexExists(name))) {
          await designsCollection.createIndex(index, { name });
        }
      }

      await db.createCollection(PURCHASED_GIFT_CARDS_COLLECTION_NAME);
      const purchasesCollection = db.collection(
        PURCHASED_GIFT_CARDS_COLLECTION_NAME,
      );

      const purchaseIndexes: Record<string, Record<string, 1>> = {
        organizationId_appId_1: { organizationId: 1, appId: 1 },
        organizationId_appId_designId_1: {
          organizationId: 1,
          appId: 1,
          designId: 1,
        },
        organizationId_appId_customerId_1: {
          organizationId: 1,
          appId: 1,
          customerId: 1,
        },
        organizationId_appId_createdAt_1: {
          organizationId: 1,
          appId: 1,
          createdAt: 1,
        },
      };

      for (const [name, index] of Object.entries(purchaseIndexes)) {
        if (!(await purchasesCollection.indexExists(name))) {
          await purchasesCollection.createIndex(index, { name });
        }
      }
    } finally {
      logger.debug("Gift Card Studio app installed");
    }
  }

  public async unInstall(): Promise<void> {
    const logger = this.loggerFactory("unInstall");
    logger.debug("Uninstalling Gift Card Studio app");

    const db = await this.getDbConnection();
    await db
      .collection(GIFT_CARD_DESIGNS_COLLECTION_NAME)
      .deleteMany({ appId: this.appId, organizationId: this.organizationId });
    await db
      .collection(PURCHASED_GIFT_CARDS_COLLECTION_NAME)
      .deleteMany({ appId: this.appId, organizationId: this.organizationId });

    logger.debug("Gift Card Studio app uninstalled");
  }

  public async hasPurchases(): Promise<boolean> {
    const db = await this.getDbConnection();
    const purchase = await db
      .collection<PurchasedGiftCardModel>(PURCHASED_GIFT_CARDS_COLLECTION_NAME)
      .findOne({
        appId: this.appId,
        organizationId: this.organizationId,
      });
    return !!purchase;
  }
}
