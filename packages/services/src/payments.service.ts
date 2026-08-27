import {
  AppointmentRequest,
  IConnectedAppsService,
  IEventService,
  IPaymentProcessor,
  IPaymentsService,
  OnlinePaymentMethod,
  Payment,
  PAYMENT_CREATED_EVENT_TYPE,
  PAYMENT_DELETED_EVENT_TYPE,
  PAYMENT_REFUNDED_EVENT_TYPE,
  PAYMENT_UPDATED_EVENT_TYPE,
  PaymentExportRow,
  PaymentIntent,
  PaymentIntentUpdateModel,
  PaymentMethod,
  PAYMENTS_EXPORT_MAX_ROWS,
  PaymentSummary,
  PaymentType,
  PaymentUpdateModel,
  Query,
  WithTotal,
  type DateRange,
  type EventSource,
  type PaymentCreatedPayload,
  type PaymentDeletedPayload,
  type PaymentRefundedPayload,
  type PaymentUpdatedPayload,
} from "@hacado/types";
import { deepEqual, escapeRegex } from "@hacado/utils";
import { Document, Filter, ObjectId, Sort } from "mongodb";
import {
  APPOINTMENTS_COLLECTION_NAME,
  CUSTOMERS_COLLECTION_NAME,
  PAYMENT_INTENTS_COLLECTION_NAME,
  PAYMENTS_COLLECTION_NAME,
} from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

export class PaymentsExportLimitExceededError extends Error {
  public readonly name = "PaymentsExportLimitExceededError";

  public constructor(
    public readonly limit: number,
    public readonly count: number,
  ) {
    super(`Payments export limit exceeded: ${count} rows (max ${limit})`);
  }
}

type PaymentsListQuery = {
  range?: DateRange;
  customerId?: string;
  appointmentId?: string;
  type?: PaymentType[];
  method?: PaymentMethod[];
  search?: string;
  sort?: Query["sort"];
};

export class PaymentsService extends BaseService implements IPaymentsService {
  public constructor(
    organizationId: string,
    protected readonly connectedAppsService: IConnectedAppsService,
    protected readonly eventService: IEventService,
  ) {
    super("PaymentsService", organizationId);
  }

  public async createIntent(
    intent: Omit<PaymentIntentUpdateModel, "status">,
  ): Promise<PaymentIntent> {
    const logger = this.loggerFactory("createIntent");
    logger.debug(
      {
        intent: {
          amount: intent.amount,
          appId: intent.appId,
          appointmentId: intent.appointmentId,
          customerId: intent.customerId,
          appName: intent.appName,
          type: intent.type,
        },
      },
      "Creating payment intent",
    );

    const db = await getDbConnection();
    const intents = db.collection<PaymentIntent>(
      PAYMENT_INTENTS_COLLECTION_NAME,
    );

    const dbIntent = {
      ...intent,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      status: "created",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PaymentIntent;

    await intents.insertOne(dbIntent);

    logger.debug(
      {
        intentId: dbIntent._id,
        amount: dbIntent.amount,
        appId: dbIntent.appId,
        appointmentId: dbIntent.appointmentId,
        customerId: dbIntent.customerId,
        appName: dbIntent.appName,
        type: dbIntent.type,
      },
      "Successfully created payment intent",
    );

    return dbIntent;
  }

  public async getIntent(id: string): Promise<PaymentIntent | null> {
    const logger = this.loggerFactory("getIntent");
    logger.debug({ intentId: id }, "Getting payment intent by id");

    const db = await getDbConnection();
    const intents = db.collection<PaymentIntent>(
      PAYMENT_INTENTS_COLLECTION_NAME,
    );

    const intent = await intents.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!intent) {
      logger.warn({ intentId: id }, "Payment intent not found");
    } else {
      logger.debug(
        {
          intentId: id,
          status: intent.status,
          amount: intent.amount,
          appId: intent.appId,
          appointmentId: intent.appointmentId,
          customerId: intent.customerId,
          appName: intent.appName,
        },
        "Payment intent found",
      );
    }

    return intent;
  }

  public async getIntentByExternalId(
    externalId: string,
  ): Promise<PaymentIntent | null> {
    const logger = this.loggerFactory("getIntentByExternalId");
    logger.debug({ externalId }, "Getting payment intent by external id");

    const db = await getDbConnection();
    const intents = db.collection<PaymentIntent>(
      PAYMENT_INTENTS_COLLECTION_NAME,
    );

    const intent = await intents.findOne({
      externalId,
      organizationId: this.organizationId,
    });

    if (!intent) {
      logger.warn({ externalId }, "Payment intent not found by external id");
    } else {
      logger.debug(
        {
          externalId,
          intentId: intent._id,
          status: intent.status,
          amount: intent.amount,
          appId: intent.appId,
          type: intent.type,
        },
        "Payment intent found by external id",
      );
    }

    return intent;
  }

  public async findReusablePaidIntentForAppointmentRequest({
    appId,
    amount,
    type,
    request,
  }: {
    appId: string;
    amount: number;
    type: Exclude<PaymentType, "rescheduleFee" | "cancellationFee">;
    request: AppointmentRequest;
  }): Promise<PaymentIntent | null> {
    const logger = this.loggerFactory(
      "findReusablePaidIntentForAppointmentRequest",
    );
    logger.debug(
      {
        appId,
        amount,
        type,
        optionId: request.optionId,
        customerEmail: request.fields.email,
        dateTime: request.dateTime,
      },
      "Looking for reusable paid payment intent",
    );

    const db = await getDbConnection();
    const intents = db.collection<PaymentIntent>(
      PAYMENT_INTENTS_COLLECTION_NAME,
    );
    const payments = db.collection<Payment & { intentId?: string }>(
      PAYMENTS_COLLECTION_NAME,
    );

    const candidates = await intents
      .find({
        organizationId: this.organizationId,
        status: "paid",
        appId,
        amount,
        type,
        appointmentId: { $exists: false },
        "request.optionId": request.optionId,
        "request.fields.email": request.fields.email,
        "request.dateTime": request.dateTime,
      })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray();

    for (const candidate of candidates) {
      if (!deepEqual(candidate.request, request)) {
        continue;
      }

      const existingPayment = await payments.findOne({
        organizationId: this.organizationId,
        intentId: candidate._id,
      });

      if (existingPayment) {
        logger.debug(
          { intentId: candidate._id, paymentId: existingPayment._id },
          "Skipping candidate intent because payment row already exists",
        );
        continue;
      }

      logger.info(
        { intentId: candidate._id, appId, amount, type },
        "Found reusable paid payment intent",
      );
      return candidate;
    }

    logger.debug(
      { candidateCount: candidates.length, appId, amount, type },
      "No reusable paid payment intent found",
    );
    return null;
  }

  public async updateIntent(
    id: string,
    update: Partial<PaymentIntentUpdateModel>,
  ): Promise<PaymentIntent> {
    const logger = this.loggerFactory("updateIntent");
    logger.debug({ intentId: id, update }, "Updating payment intent");

    const {
      _id: _,
      organizationId: __,
      paidAt,
      ...updateObj
    } = update as PaymentIntent; // Remove fields in case it slips here
    const db = await getDbConnection();
    const intents = db.collection<PaymentIntent>(
      PAYMENT_INTENTS_COLLECTION_NAME,
    );

    const $set: Partial<PaymentIntent> = {
      ...updateObj,
      updatedAt: new Date(),
    };

    if (updateObj.status === "paid") {
      $set.paidAt = new Date();
    }

    await intents.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set,
      },
    );

    const updatedIntent = await intents.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!updatedIntent) {
      logger.error({ intentId: id }, "Failed to fetch updated intent");
      throw new Error("Failed to fetch updated intent");
    }

    logger.debug(
      { intentId: id, status: updatedIntent.status },
      "Successfully updated payment intent",
    );
    return updatedIntent;
  }

  public async createPayment(
    payment: PaymentUpdateModel,
    source: EventSource,
  ): Promise<Payment> {
    const logger = this.loggerFactory("createPayment");
    logger.debug(
      {
        payment: {
          amount: payment.amount,
          method: payment.method,
          type: payment.type,
          appId: "appId" in payment ? payment.appId : undefined,
          appName: "appName" in payment ? payment.appName : undefined,
          appointmentId: payment.appointmentId,
          customerId: payment.customerId,
        },
      },
      "Creating payment",
    );

    const db = await getDbConnection();
    const payments = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);

    const dbPayment: Payment = {
      ...payment,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      updatedAt: new Date(),
    };

    await payments.insertOne(dbPayment);

    logger.debug(
      { paymentId: dbPayment._id, amount: dbPayment.amount },
      "Successfully created payment, executing hooks",
    );

    await this.eventService.emit(
      PAYMENT_CREATED_EVENT_TYPE,
      {
        payment: dbPayment,
      } satisfies PaymentCreatedPayload,
      source,
    );

    return dbPayment;
  }

  public async list(
    query: Query & {
      range?: DateRange;
      customerId?: string;
      appointmentId?: string;
      type?: PaymentType[];
      method?: PaymentMethod[];
    },
  ): Promise<WithTotal<PaymentSummary>> {
    const logger = this.loggerFactory("list");
    logger.debug({ query }, "Listing payments");

    const db = await getDbConnection();
    const collection = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);
    const { pipeline, sort } = this.buildPaymentsListPipeline(query, "summary");

    const [result] = await collection
      .aggregate<{
        items: PaymentSummary[];
        total: { count: number }[];
      }>([
        ...pipeline,
        {
          $facet: {
            items: [
              { $sort: sort },
              { $skip: query.offset || 0 },
              { $limit: query.limit || 50 },
            ],
            total: [{ $count: "count" }],
          },
        },
      ])
      .toArray();

    const items = result?.items ?? [];
    const total = result?.total?.[0]?.count ?? 0;

    logger.debug(
      { total, count: items.length, offset: query.offset, limit: query.limit },
      "Listed payments",
    );

    return { items, total };
  }

  public async listForExport(
    query: Omit<Query, "offset" | "limit"> & PaymentsListQuery,
  ): Promise<PaymentExportRow[]> {
    const logger = this.loggerFactory("listForExport");
    logger.debug({ query }, "Listing payments for export");

    const db = await getDbConnection();
    const collection = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);
    const { pipeline, sort } = this.buildPaymentsListPipeline(query, "export");

    const [countResult] = await collection
      .aggregate<{ count: number }>([...pipeline, { $count: "count" }])
      .toArray();

    const count = countResult?.count ?? 0;
    if (count > PAYMENTS_EXPORT_MAX_ROWS) {
      throw new PaymentsExportLimitExceededError(
        PAYMENTS_EXPORT_MAX_ROWS,
        count,
      );
    }

    const items = await collection
      .aggregate<PaymentExportRow>([...pipeline, { $sort: sort }])
      .toArray();

    logger.debug({ count: items.length }, "Listed payments for export");

    return items;
  }

  private buildPaymentsListPipeline(
    query: PaymentsListQuery,
    mode: "summary" | "export",
  ): { pipeline: Document[]; sort: Sort } {
    const match: Filter<Payment> = {
      organizationId: this.organizationId,
    };

    if (query.customerId) {
      match.customerId = query.customerId;
    }
    if (query.appointmentId) {
      match.appointmentId = query.appointmentId;
    }
    if (query.type?.length) {
      match.type = { $in: query.type };
    }
    if (query.method?.length) {
      match.method = { $in: query.method };
    }
    if (query.range?.start || query.range?.end) {
      const paidAt: Record<string, Date> = {};
      if (query.range.start) {
        paidAt.$gte = query.range.start;
      }
      if (query.range.end) {
        paidAt.$lte = query.range.end;
      }
      match.paidAt = paidAt;
    }

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({ ...prev, [curr.id]: curr.desc ? -1 : 1 }),
      {},
    ) || { paidAt: -1 };

    const addFields =
      mode === "export"
        ? {
            customerName: { $arrayElemAt: ["$customer.name", 0] },
            customerEmail: { $arrayElemAt: ["$customer.email", 0] },
            customerPhone: { $arrayElemAt: ["$customer.phone", 0] },
            serviceName: { $arrayElemAt: ["$appointment.option.name", 0] },
            appointmentDateTime: {
              $arrayElemAt: ["$appointment.dateTime", 0],
            },
            appointmentStatus: { $arrayElemAt: ["$appointment.status", 0] },
            appointmentTotalPrice: {
              $arrayElemAt: ["$appointment.totalPrice", 0],
            },
            addonNames: {
              $let: {
                vars: {
                  appointmentDoc: { $arrayElemAt: ["$appointment", 0] },
                },
                in: {
                  $map: {
                    input: { $ifNull: ["$$appointmentDoc.addons", []] },
                    as: "addon",
                    in: "$$addon.name",
                  },
                },
              },
            },
          }
        : {
            customerName: { $arrayElemAt: ["$customer.name", 0] },
            serviceName: { $arrayElemAt: ["$appointment.option.name", 0] },
          };

    const pipeline: Document[] = [
      { $match: match },
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
      { $addFields: addFields },
      { $project: { customer: 0, appointment: 0 } },
    ];

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      pipeline.push({
        $match: {
          $or: [
            { customerName: $regex },
            { serviceName: $regex },
            { description: $regex },
            { externalId: $regex },
            { appName: $regex },
          ],
        },
      });
    }

    return { pipeline, sort };
  }

  public async getPayment(id: string): Promise<Payment | null> {
    const logger = this.loggerFactory("getPayment");
    logger.debug({ paymentId: id }, "Getting payment by id");

    const db = await getDbConnection();
    const payments = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);

    const payment = await payments.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!payment) {
      logger.warn({ paymentId: id }, "Payment not found");
    } else {
      logger.debug(
        {
          paymentId: id,
          status: payment.status,
          amount: payment.amount,
          method: payment.method,
          type: payment.type,
          appId: "appId" in payment ? payment.appId : undefined,
          appName: "appName" in payment ? payment.appName : undefined,
          appointmentId: payment.appointmentId,
          customerId: payment.customerId,
        },
        "Payment found",
      );
    }

    return payment;
  }

  public async getPaymentByExternalId(
    externalId: string,
  ): Promise<Payment | null> {
    const logger = this.loggerFactory("getPaymentByExternalId");
    logger.debug({ externalId }, "Getting payment by external id");

    const db = await getDbConnection();
    const payments = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);

    const payment = await payments.findOne({
      externalId,
      organizationId: this.organizationId,
    });

    if (!payment) {
      logger.warn({ externalId }, "Payment not found by external id");
    } else {
      logger.debug(
        {
          externalId,
          paymentId: payment._id,
        },
        "Payment found by external id",
      );
    }

    return payment;
  }

  public async getAppointmentPayments(
    appointmentId: string,
  ): Promise<Payment[]> {
    const logger = this.loggerFactory("getAppointmentPayments");
    logger.debug({ appointmentId }, "Getting appointment payments");

    const db = await getDbConnection();

    const paymentsCollection = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);
    const payments = await paymentsCollection
      .find({ appointmentId, organizationId: this.organizationId })
      .toArray();

    if (payments.length === 0) {
      logger.warn({ appointmentId }, "No payments found for appointment");
    } else {
      logger.debug(
        { appointmentId, count: payments.length },
        "Successfully retrieved appointment payments",
      );
    }

    return payments;
  }

  public async updatePayment(
    id: string,
    update: Partial<PaymentUpdateModel>,
    source: EventSource,
  ): Promise<Payment> {
    const logger = this.loggerFactory("updatePayment");
    logger.debug({ paymentId: id, update }, "Updating payment");

    const { _id: _, organizationId: __, ...updateObj } = update as Payment; // Remove fields in case it slips here
    const db = await getDbConnection();
    const payments = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);

    const $set: Partial<Payment> = {
      ...updateObj,
      updatedAt: new Date(),
    };

    await payments.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set,
      },
    );

    const updatedPayment = await payments.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!updatedPayment) {
      logger.error({ paymentId: id }, "Failed to fetch updated payment");
      throw new Error("Failed to fetch updated intent");
    }

    logger.debug(
      { paymentId: id, status: updatedPayment.status },
      "Successfully updated payment, executing hooks",
    );

    await this.eventService.emit(
      PAYMENT_UPDATED_EVENT_TYPE,
      {
        payment: updatedPayment,
        update,
      } satisfies PaymentUpdatedPayload,
      source,
    );

    return updatedPayment;
  }

  public async deletePayment(
    id: string,
    source: EventSource,
  ): Promise<Payment | null> {
    const logger = this.loggerFactory("deletePayment");
    logger.debug({ paymentId: id }, "Deleting payment");

    const db = await getDbConnection();
    const payments = db.collection<Payment>(PAYMENTS_COLLECTION_NAME);

    const payment = await payments.findOneAndDelete({
      _id: id,
      organizationId: this.organizationId,
    });
    if (!payment) {
      logger.warn({ paymentId: id }, "Payment not found");
      return null;
    }

    logger.debug(
      { paymentId: id },
      "Successfully deleted payment, executing hooks",
    );

    await this.eventService.emit(
      PAYMENT_DELETED_EVENT_TYPE,
      {
        payment,
      } satisfies PaymentDeletedPayload,
      source,
    );

    return payment;
  }

  public async refundPayment(
    id: string,
    amount: number,
    source: EventSource,
  ): Promise<
    | { success: false; error: string; status: number }
    | { success: true; updatedPayment: Payment }
  > {
    const logger = this.loggerFactory("refundPayment");
    logger.debug({ paymentId: id, amount }, "Processing payment refund");

    const payment = await this.getPayment(id);
    if (!payment) {
      logger.warn({ paymentId: id, amount }, "Payment not found for refund");
      return { success: false, error: "payment_not_found", status: 404 };
    }

    if (payment.method !== "online" && payment.method !== "gift-card") {
      logger.error(
        { paymentId: id, method: payment.method, amount },
        "Only online and gift card payments supported for refund",
      );

      return {
        success: false,
        error: "only_online_and_gift_card_payments_supported",
        status: 405,
      };
    }

    // if (payment.status !== "paid") {
    //   logger.error(
    //     { paymentId: id, status: payment.status, amount },
    //     "Wrong payment status for refund"
    //   );

    //   return { success: false, error: "wrong_payment_status", status: 405 };
    // }

    const totalRefunded =
      (payment.refunds || [])?.reduce(
        (acc, refund) => acc + refund.amount,
        0,
      ) || 0;

    if (totalRefunded + amount > payment.amount) {
      logger.error(
        {
          paymentId: id,
          amount,
          totalRefunded: payment.refunds?.reduce(
            (acc, refund) => acc + refund.amount,
            0,
          ),
        },
        "Refund amount exceeds payment amount",
      );
      return {
        success: false,
        error: "refund_amount_exceeds_payment_amount",
        status: 405,
      };
    }

    if (payment.method === "gift-card") {
      return this.refundGiftCardPayment(payment, amount, source);
    }

    return this.refundOnlinePayment(payment, amount, source);
  }

  private async refundGiftCardPayment(
    payment: Payment,
    amount: number,
    source: EventSource,
  ): Promise<
    | { success: false; error: string; status: number }
    | { success: true; updatedPayment: Payment }
  > {
    const logger = this.loggerFactory("refundGiftCardPayment");
    logger.debug(
      { paymentId: payment._id, amount },
      "Processing gift card payment refund",
    );

    const updatedPayment = await this.updatePayment(
      payment._id,
      {
        status: "refunded",
        refunds: [
          ...(payment.refunds || []),
          { amount, refundedAt: new Date() },
        ],
      },
      source,
    );

    logger.debug(
      { paymentId: payment._id, amount },
      "Successfully processed gift card payment refund, executing hooks",
    );

    await this.eventService.emit(
      PAYMENT_REFUNDED_EVENT_TYPE,
      {
        payment: updatedPayment,
        amount,
      } satisfies PaymentRefundedPayload,
      source,
    );

    return { success: true, updatedPayment };
  }

  private async refundOnlinePayment(
    payment: Extract<Payment, { method: OnlinePaymentMethod }>,
    amount: number,
    source: EventSource,
  ): Promise<
    | { success: false; error: string; status: number }
    | { success: true; updatedPayment: Payment }
  > {
    const logger = this.loggerFactory("refundOnlinePayment");
    logger.debug(
      { paymentId: payment._id, amount },
      "Processing online payment refund",
    );

    try {
      const { app, service } =
        await this.connectedAppsService.getAppService<IPaymentProcessor>(
          payment.appId,
        );
      if (!service.refundPayment) {
        logger.error(
          { paymentId: payment._id, appId: payment.appId, amount },
          "Refund not supported by payment app",
        );

        throw new Error("refund_not_supported");
      }

      const result = await service.refundPayment(app, payment, amount);
      if (result.success) {
        const updatedPayment = await this.updatePayment(
          payment._id,
          {
            status: "refunded",
            refunds: [
              ...(payment.refunds || []),
              { amount, refundedAt: new Date() },
            ],
          },
          source,
        );

        logger.debug(
          { paymentId: payment._id, amount },
          "Successfully processed payment refund, executing hooks",
        );

        await this.eventService.emit(
          PAYMENT_REFUNDED_EVENT_TYPE,
          {
            payment: updatedPayment,
            amount,
          } satisfies PaymentRefundedPayload,
          source,
        );

        return { success: true, updatedPayment };
      }

      logger.error(
        { paymentId: payment._id, error: result.error, amount },
        "Payment app refund failed",
      );

      return {
        success: false,
        status: 400,
        error: result.error || "app_does_not_support_refund",
      };
    } catch (error) {
      logger.error(
        { paymentId: payment._id, error, amount },
        "Payment app does not support refund",
      );

      return {
        success: false,
        error: "app_does_not_support_refund",
        status: 405,
      };
    }
  }
}
