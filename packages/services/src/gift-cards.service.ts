import {
  DateRange,
  GIFT_CARD_CREATED_EVENT_TYPE,
  GIFT_CARD_DELETED_EVENT_TYPE,
  GIFT_CARD_STATUS_CHANGED_EVENT_TYPE,
  GIFT_CARD_UPDATED_EVENT_TYPE,
  GiftCard,
  GiftCardListModel,
  GiftCardStatus,
  GiftCardUpdateModel,
  IEventService,
  IGiftCardsService,
  InPersonPaymentMethod,
  inPersonPaymentMethod,
  IPaymentsService,
  Payment,
  PaymentSummary,
  Query,
  WithTotal,
  type EventSource,
  type GiftCardCreatedPayload,
  type GiftCardDeletedPayload,
  type GiftCardStatusChangedPayload,
  type GiftCardUpdatedPayload,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex } from "@hacado/utils";
import { Filter, ObjectId, Sort } from "mongodb";
import {
  APPOINTMENTS_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
  GIFT_CARDS_COLLECTION_NAME,
  PAYMENTS_COLLECTION_NAME,
} from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

export class GiftCardsService extends BaseService implements IGiftCardsService {
  public constructor(
    organizationId: string,
    protected readonly paymentsService: IPaymentsService,
    protected readonly eventService: IEventService,
  ) {
    super("GiftCardsService", organizationId);
  }

  public async createGiftCard(
    giftCard: Omit<GiftCardUpdateModel, "status">,
    source: EventSource,
  ): Promise<GiftCardListModel> {
    const logger = this.loggerFactory("createGiftCard");
    logger.debug({ giftCard }, "Creating gift card");
    const dbGiftCard: Omit<
      GiftCard,
      "giftCardPayment" | "payments" | "customer" | "amountLeft"
    > & {
      status: "active";
    } = {
      ...giftCard,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
    };

    if (!this.checkGiftCardCodeUnique(dbGiftCard.code)) {
      logger.error({ giftCard }, "Gift card code already exists");
      throw new Error("Gift card code already exists");
    }

    if (!this.paymentsService.getPayment(giftCard.paymentId)) {
      logger.error({ giftCard }, "Payment not found");
      throw new Error("Payment not found");
    }

    const db = await getDbConnection();
    const giftCards = db.collection<typeof dbGiftCard>(
      GIFT_CARDS_COLLECTION_NAME,
    );
    await giftCards.insertOne(dbGiftCard);

    const newGiftCard = (await this.getGiftCard(
      dbGiftCard._id,
    )) as GiftCardListModel;

    await this.eventService.emit(
      GIFT_CARD_CREATED_EVENT_TYPE,
      {
        giftCard: newGiftCard,
      } satisfies GiftCardCreatedPayload,
      source,
    );

    logger.debug({ giftCardId: newGiftCard._id }, "Gift card created");
    return newGiftCard;
  }

  public async updateGiftCard(
    id: string,
    giftCard: GiftCardUpdateModel,
    source: EventSource,
  ): Promise<GiftCardListModel | null> {
    const logger = this.loggerFactory("updateGiftCard");
    logger.debug({ id, giftCard }, "Updating gift card");

    if (!this.checkGiftCardCodeUnique(giftCard.code, id)) {
      logger.error({ giftCard }, "Gift card code already exists");
      throw new Error("Gift card code already exists");
    }

    const payment = await this.paymentsService.getPayment(giftCard.paymentId);
    if (!payment) {
      logger.error({ giftCard }, "Payment not found");
      throw new Error("Payment not found");
    }

    const db = await getDbConnection();
    const giftCards = db.collection<GiftCard>(GIFT_CARDS_COLLECTION_NAME);
    const { _id, organizationId, createdAt, status, ...updateObj } =
      giftCard as GiftCard;

    const existingGiftCard = await this.getGiftCard(id);

    if (!existingGiftCard) {
      logger.warn({ id }, "Gift card not found");
      return null;
    }

    if (existingGiftCard.paymentId !== payment._id) {
      logger.error({ giftCard }, "Payment ID mismatch");
      throw new Error("Payment ID mismatch");
    }

    if (payment.amount !== giftCard.amount) {
      logger.debug(
        {
          id,
          paymentId: payment._id,
          paymentAmount: payment.amount,
          giftCardAmount: giftCard.amount,
        },
        "Payment amount mismatch, updating payment amount",
      );

      const payments = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);
      const hasPayments = await payments
        .aggregate([
          {
            $match: {
              giftCardId: id,
              organizationId: this.organizationId,
              method: "gift-card",
            },
          },
        ])
        .hasNext();

      if (hasPayments) {
        logger.error(
          { giftCard },
          "Gift card has payments, cannot update amount",
        );
        throw new Error("Gift card has payments, cannot update amount");
      }

      if (
        !inPersonPaymentMethod.includes(payment.method as InPersonPaymentMethod)
      ) {
        logger.error(
          { id, paymentId: payment._id },
          "Payment is not an in-person payment, cannot update gift card amount",
        );

        throw new Error(
          "Payment is not an in-person payment, cannot update gift card amount",
        );
      }

      await payments.updateOne(
        { _id: payment._id, organizationId: this.organizationId },
        { $set: { amount: giftCard.amount } },
      );
    }

    const result = await giftCards.updateOne(
      { _id: id, organizationId: this.organizationId },
      {
        $set: {
          ...updateObj,
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      logger.warn({ id }, "Gift card not found");
      throw new Error("Gift card not found");
    }

    const updatedGiftCard = (await this.getGiftCard(id)) as GiftCardListModel;
    await this.eventService.emit(
      GIFT_CARD_UPDATED_EVENT_TYPE,
      {
        giftCard: updatedGiftCard,
        previous: giftCard,
      } satisfies GiftCardUpdatedPayload,
      source,
    );

    logger.debug({ id }, "Gift card updated");

    return updatedGiftCard;
  }

  public async setGiftCardStatus(
    id: string,
    status: GiftCardStatus,
    source: EventSource,
  ): Promise<GiftCardListModel | null> {
    const logger = this.loggerFactory("setGiftCardStatus");
    logger.debug({ id, status }, "Setting gift card status");

    const existingGiftCard = await this.getGiftCard(id);
    if (!existingGiftCard) {
      logger.warn({ id }, "Gift card not found");
      return null;
    }

    const db = await getDbConnection();
    const giftCards = db.collection<GiftCard>(GIFT_CARDS_COLLECTION_NAME);
    const result = await giftCards.updateOne(
      { _id: id, organizationId: this.organizationId },
      { $set: { status, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      logger.warn({ id }, "Gift card not found");
      return null;
    }

    const updatedGiftCard = (await this.getGiftCard(id)) as GiftCardListModel;
    await this.eventService.emit(
      GIFT_CARD_STATUS_CHANGED_EVENT_TYPE,
      {
        ids: [id],
        status,
      } satisfies GiftCardStatusChangedPayload,
      source,
    );

    logger.debug({ id, status }, "Gift card status updated");
    return updatedGiftCard;
  }

  public async setGiftCardsStatus(
    ids: string[],
    status: GiftCardStatus,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("setGiftCardsStatus");
    logger.debug({ ids, status }, "Setting gift cards status");

    if (!ids.length) {
      logger.warn("No gift card ids provided");
      return;
    }

    const db = await getDbConnection();
    const giftCards = db.collection<GiftCard>(GIFT_CARDS_COLLECTION_NAME);
    await giftCards.updateMany(
      { _id: { $in: ids }, organizationId: this.organizationId },
      { $set: { status, updatedAt: new Date() } },
    );

    await this.eventService.emit(
      GIFT_CARD_STATUS_CHANGED_EVENT_TYPE,
      {
        ids,
        status,
      } satisfies GiftCardStatusChangedPayload,
      source,
    );

    logger.debug({ ids, status }, "Gift cards status updated");
  }

  public async deleteGiftCard(
    id: string,
    source: EventSource,
    sourceAppId?: string,
  ): Promise<GiftCardListModel | null> {
    const logger = this.loggerFactory("deleteGiftCard");
    logger.debug({ id }, "Deleting gift card");
    const db = await getDbConnection();
    const giftCards = db.collection<GiftCard>(GIFT_CARDS_COLLECTION_NAME);
    const payments = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);

    const giftCard = await this.getGiftCard(id);
    if (!giftCard) {
      logger.warn({ id }, "Gift card not found");
      return null;
    }

    if (giftCard.source?.appId !== sourceAppId) {
      logger.warn({ id, sourceAppId }, "Gift card source app ID mismatch");
      return null;
    }

    const giftCardPayment = await this.paymentsService.getPayment(
      giftCard.paymentId,
    );

    if (
      giftCardPayment?.method &&
      !(inPersonPaymentMethod as readonly string[]).includes(
        giftCardPayment.method,
      )
    ) {
      logger.warn(
        { id },
        "Gift card payment is not an in-person payment, cannot delete gift card",
      );

      return null;
    }

    const hasPayment = await payments
      .aggregate([
        {
          $match: {
            _id: id,
            organizationId: this.organizationId,
            method: "gift-card",
            giftCardId: id,
          },
        },
      ])
      .hasNext();

    if (hasPayment) {
      logger.warn(
        { id },
        "Payments using this gift card found, cannot delete gift card",
      );
      return null;
    }

    await giftCards.deleteOne({ _id: id, organizationId: this.organizationId });
    await this.paymentsService.deletePayment(giftCard.paymentId, source);

    await this.eventService.emit(
      GIFT_CARD_DELETED_EVENT_TYPE,
      {
        giftCardIds: [id],
      } satisfies GiftCardDeletedPayload,
      source,
    );

    logger.debug({ id }, "Gift card deleted");
    return giftCard;
  }

  public async deleteGiftCards(
    ids: string[],
    source: EventSource,
    sourceAppId?: string,
  ): Promise<void> {
    const logger = this.loggerFactory("deleteGiftCards");
    logger.debug({ ids }, "Deleting gift cards");
    const db = await getDbConnection();
    const giftCards = db.collection<GiftCard>(GIFT_CARDS_COLLECTION_NAME);
    const payments = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);

    const giftCardsToDelete = await giftCards
      .aggregate([
        {
          $match: {
            _id: { $in: ids },
            organizationId: this.organizationId,
          },
        },
        {
          $lookup: {
            from: PAYMENTS_COLLECTION_NAME,
            localField: "paymentId",
            foreignField: "_id",
            as: "payment",
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
          $unwind: "$payment",
          preserveNullAndEmptyArrays: true,
        },
        {
          $addFields: {
            payment: {
              $ifNull: ["$payment", null],
            },
          },
        },
      ])
      .toArray();

    const toDelete = giftCardsToDelete.filter(
      (giftCard) =>
        (!giftCard.payment ||
          inPersonPaymentMethod.includes(giftCard.payment.method)) &&
        giftCard.source?.appId === sourceAppId,
    );

    const giftCardIdsToDelete = toDelete.map((giftCard) => giftCard._id);
    const paymentIdsToDelete = toDelete
      .map((giftCard) => giftCard.payment?._id)
      .filter((paymentId) => !!paymentId);

    if (giftCardIdsToDelete.length === 0) {
      logger.warn({ ids }, "No gift cards to delete");
      return;
    }

    const hasGiftCardsWithPayments = await payments
      .aggregate([
        {
          $match: {
            method: "gift-card",
            giftCardId: { $in: giftCardIdsToDelete },
            organizationId: this.organizationId,
          },
        },
      ])
      .hasNext();

    if (hasGiftCardsWithPayments) {
      logger.warn({ ids }, "Gift cards with payments cannot be deleted");
      return;
    }

    logger.debug({ giftCardIdsToDelete }, "Deleting gift cards");

    await giftCards.deleteMany({
      _id: { $in: giftCardIdsToDelete },
      organizationId: this.organizationId,
    });

    logger.debug({ paymentIdsToDelete }, "Deleting payments");

    await payments.deleteMany({
      _id: { $in: paymentIdsToDelete },
      organizationId: this.organizationId,
    });

    await this.eventService.emit(
      GIFT_CARD_DELETED_EVENT_TYPE,
      {
        giftCardIds: giftCardIdsToDelete,
      } satisfies GiftCardDeletedPayload,
      source,
    );

    logger.debug({ ids }, "Gift cards deleted");
  }

  public async getGiftCard(id: string): Promise<GiftCardListModel | null> {
    const logger = this.loggerFactory("getGiftCard");
    logger.debug({ id }, "Getting gift card");

    const db = await getDbConnection();
    const giftCards = db.collection<GiftCard>(GIFT_CARDS_COLLECTION_NAME);

    const result = (await giftCards
      .aggregate([
        ...this.aggregateJoin,
        {
          $match: { _id: id },
        },
      ])
      .next()) as GiftCardListModel | null;

    if (!result) {
      logger.warn({ id }, "Gift card not found");
      return null;
    }

    return result;
  }

  public async getGiftCardByCode(
    code: string,
  ): Promise<GiftCardListModel | null> {
    const logger = this.loggerFactory("getGiftCardByCode");
    logger.debug({ code }, "Getting gift card by code");
    const db = await getDbConnection();
    const giftCards = db.collection<GiftCard>(GIFT_CARDS_COLLECTION_NAME);

    const result = (await giftCards
      .aggregate([
        ...this.aggregateJoin,
        {
          $match: { code },
        },
      ])
      .next()) as GiftCardListModel | null;

    if (!result) {
      logger.warn({ code }, "Gift card not found");
      return null;
    }

    return result;
  }

  public async getGiftCards(
    query: Query & {
      priorityIds?: string[];
      status?: GiftCardStatus[];
      customerId?: string | string[];
      expiresAt?: DateRange;
    },
  ): Promise<WithTotal<GiftCardListModel>> {
    const logger = this.loggerFactory("getGiftCards");
    logger.debug({ query }, "Getting gift cards");
    const db = await getDbConnection();
    const giftCards = db.collection<GiftCard>(GIFT_CARDS_COLLECTION_NAME);

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { createdAt: -1 };

    const filter: Filter<GiftCardListModel> = {
      organizationId: this.organizationId,
      isDeleted: { $ne: true },
    };

    const $filterAnd: Filter<GiftCardListModel>[] = [];

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<GiftCardListModel>(
        { $regex },
        "code",
        "customer.name",
        "customer.phone",
        "customer.email",
        "customer.knownNames",
        "customer.knownEmails",
        "customer.knownPhones",
        "customer.note",
      );

      $filterAnd.push({ $or: queries });
    }

    if (query.status && query.status.length === 1) {
      // if status active: active status and expiresAt is not set or in the future and amountLeft is greater than 0
      // if status inactive: inactive status and expiresAt is set and in the past or amountLeft is 0
      const status = query.status?.[0] ?? "active";
      const $statusFilter: Filter<GiftCardListModel>[] = [];
      if (status === "active") {
        $statusFilter.push({ status: "active" });
        $statusFilter.push({
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gte: new Date() } },
          ],
        });
        $statusFilter.push({ amountLeft: { $gt: 0 } });

        $filterAnd.push({ $and: $statusFilter });
      } else {
        $statusFilter.push({ status: "inactive" });
        $statusFilter.push({
          $or: [
            { expiresAt: { $exists: true } },
            { expiresAt: { $lt: new Date() } },
          ],
        });
        $statusFilter.push({ amountLeft: { $eq: 0 } });

        $filterAnd.push({ $$or: $statusFilter });
      }
    }

    if (query.customerId) {
      $filterAnd.push({
        customerId: {
          $in: Array.isArray(query.customerId)
            ? query.customerId
            : [query.customerId],
        },
      });
    }

    if (query.expiresAt?.start || query.expiresAt?.end) {
      const $expiresAtFilter: Filter<GiftCardListModel>["expiresAt"] = {};
      if (query.expiresAt.start) {
        $expiresAtFilter.$gte = query.expiresAt.start;
      }

      if (query.expiresAt.end) {
        $expiresAtFilter.$lte = query.expiresAt.end;
      }

      $filterAnd.push({ expiresAt: $expiresAtFilter });
    }

    if ($filterAnd.length > 0) {
      filter.$and = $filterAnd;
    }

    const [result] = await giftCards
      .aggregate([
        ...this.aggregateJoin,
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
                    {
                      $match: {
                        ...filter,
                        _id: { $nin: query.priorityIds },
                      },
                    },
                    { $sort: sort },
                  ],
                },
              },
              {
                $project: {
                  values: {
                    $concatArrays: ["$priority", "$other"],
                  },
                },
              },
              { $unwind: "$values" },
              { $replaceRoot: { newRoot: "$values" } },
            ]
          : [
              {
                $match: filter,
              },
              {
                $sort: sort,
              },
            ]),
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

    logger.debug(
      {
        query,
        result: { total: response.total, count: response.items.length },
      },
      "Fetched gift cards",
    );

    return response;
  }

  public async getGiftCardPayments(id: string): Promise<PaymentSummary[]> {
    const logger = this.loggerFactory("getGiftCardPayments");
    logger.debug({ id }, "Getting gift card payments");
    const db = await getDbConnection();
    const payments = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);

    const result = await payments
      .aggregate([
        {
          $match: {
            giftCardId: id,
            organizationId: this.organizationId,
            method: "gift-card",
          },
        },
        {
          $lookup: {
            from: CUSTOMERS_COLLECTION_NAME,
            localField: "customerId",
            foreignField: "_id",
            as: "customer",
          },
        },
        {
          $lookup: {
            from: APPOINTMENTS_COLLECTION_NAME,
            localField: "appointmentId",
            foreignField: "_id",
            as: "appointment",
          },
        },
        {
          $addFields: {
            customerName: {
              $first: "$customer.name",
            },
            serviceName: {
              $first: "$appointment.option.name",
            },
          },
        },
      ])
      .toArray();

    return result as PaymentSummary[];
  }

  public async checkGiftCardCodeUnique(
    code: string,
    id?: string,
  ): Promise<boolean> {
    const logger = this.loggerFactory("checkGiftCardCodeUnique");
    logger.debug({ code, id }, "Checking gift card code uniqueness");
    const db = await getDbConnection();
    const giftCards = db.collection<GiftCard>(GIFT_CARDS_COLLECTION_NAME);
    const result = await giftCards
      .aggregate([
        {
          $match: {
            code,
            _id: { $ne: id },
            organizationId: this.organizationId,
          },
        },
      ])
      .hasNext();

    logger.debug(
      { code, id, result },
      "Gift card code uniqueness check result",
    );

    return !result;
  }

  private get aggregateJoin() {
    return [
      {
        $match: {
          organizationId: this.organizationId,
        },
      },
      {
        $lookup: {
          from: PAYMENTS_COLLECTION_NAME,
          localField: "_id",
          foreignField: "giftCardId",
          as: "payments",
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
      // {
      //   $lookup: {
      //     from: PAYMENTS_COLLECTION_NAME,
      //     localField: "_id",
      //     foreignField: "giftCardId",
      //     as: "payments",
      //     pipeline: [
      //       {
      //         $match: {
      //           organizationId: this.organizationId,
      //           method: "gift-card",
      //         },
      //       },
      //     ],
      //   },
      // },
      // // enrich each payment with appointment
      // {
      //   $lookup: {
      //     from: "appointments",
      //     let: { paymentAppointmentIds: "$payments.appointmentId" },
      //     pipeline: [
      //       {
      //         $match: {
      //           organizationId: this.organizationId,
      //           $expr: {
      //             $in: ["$_id", "$$paymentAppointmentIds"],
      //           },
      //         },
      //       },
      //     ],
      //     as: "_appointments",
      //   },
      // },
      // // enrich each payment with customer
      // {
      //   $lookup: {
      //     from: "customers",
      //     let: { paymentCustomerIds: "$payments.customerId" },
      //     pipeline: [
      //       {
      //         $match: {
      //           organizationId: this.organizationId,
      //           $expr: {
      //             $in: ["$_id", "$$paymentCustomerIds"],
      //           },
      //         },
      //       },
      //     ],
      //     as: "_customers",
      //   },
      // },
      // // attach appointment + customer to each payment
      // {
      //   $addFields: {
      //     payments: {
      //       $map: {
      //         input: "$payments",
      //         as: "p",
      //         in: {
      //           $mergeObjects: [
      //             "$$p",
      //             {
      //               serviceName: {
      //                 $first: {
      //                   $map: {
      //                     input: {
      //                       $filter: {
      //                         input: "$_appointments",
      //                         as: "a",
      //                         cond: { $eq: ["$$a._id", "$$p.appointmentId"] },
      //                       },
      //                     },
      //                     as: "a",
      //                     in: "$$a.option.name",
      //                   },
      //                 },
      //               },
      //               customerName: {
      //                 $first: {
      //                   $map: {
      //                     input: {
      //                       $filter: {
      //                         input: "$_customers",
      //                         as: "c",
      //                         cond: { $eq: ["$$c._id", "$$p.customerId"] },
      //                       },
      //                     },
      //                     as: "c",
      //                     in: "$$c.name",
      //                   },
      //                 },
      //               },
      //             },
      //           ],
      //         },
      //       },
      //     },
      //   },
      // },
      // {
      //   $project: {
      //     _appointments: 0,
      //     _customers: 0,
      //   },
      // },
      {
        $lookup: {
          from: PAYMENTS_COLLECTION_NAME,
          localField: "paymentId",
          foreignField: "_id",
          as: "payment",
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
          customer: {
            $first: "$customer",
          },
          payment: {
            $first: "$payment",
          },
        },
      },
      {
        // calculate amount left: amount - (sum of all payments amounts - sum of all refunds amounts) and set to 0 if negative
        $addFields: {
          amountLeft: {
            $max: [
              {
                $subtract: [
                  "$amount",
                  {
                    $sum: {
                      $map: {
                        input: "$payments",
                        as: "p",
                        in: {
                          $subtract: [
                            "$$p.amount",
                            {
                              $sum: {
                                $map: {
                                  input: { $ifNull: ["$$p.refunds", []] },
                                  as: "r",
                                  in: "$$r.amount",
                                },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $set: {
          paymentsCount: {
            $size: "$payments",
          },
        },
      },
      { $unset: ["payments"] },
    ];
  }
}
