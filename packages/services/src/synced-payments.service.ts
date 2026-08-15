import {
  Appointment,
  DateRange,
  HydratedSyncedPayment,
  IBookingService,
  ICustomersService,
  IEventService,
  IngestSyncedPaymentOptions,
  IPaymentsService,
  ISyncedPaymentsService,
  PaymentUpdateModel,
  Query,
  SYNCED_PAYMENT_AMOUNTS_UPDATED_EVENT_TYPE,
  SYNCED_PAYMENT_ASSIGNED_EVENT_TYPE,
  SYNCED_PAYMENT_CONFIRMED_EVENT_TYPE,
  SYNCED_PAYMENT_IGNORED_EVENT_TYPE,
  SYNCED_PAYMENT_INGESTED_EVENT_TYPE,
  SYNCED_PAYMENT_REJECTED_EVENT_TYPE,
  SYNCED_PAYMENT_UNASSIGNED_EVENT_TYPE,
  SYNCED_PAYMENT_UNRECORDED_EVENT_TYPE,
  SyncedPayment,
  SyncedPaymentAssignablePaymentType,
  SyncedPaymentStandalonePaymentType,
  SyncedPaymentStatus,
  SyncedPaymentSuggestion,
  SyncedPaymentTransaction,
  WithTotal,
  type EventSource,
  type SyncedPaymentAmountsUpdatedPayload,
  type SyncedPaymentAssignedPayload,
  type SyncedPaymentConfirmedPayload,
  type SyncedPaymentIgnoredPayload,
  type SyncedPaymentIngestedPayload,
  type SyncedPaymentRejectedPayload,
  type SyncedPaymentUnassignedPayload,
  type SyncedPaymentUnrecordedPayload,
} from "@hacado/types";
import { round2 } from "@hacado/utils";
import { Filter, ObjectId, Sort, UpdateFilter } from "mongodb";
import { SYNCED_PAYMENTS_COLLECTION_NAME } from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

const DEFAULT_SYNCED_PAYMENT_TYPE: SyncedPaymentAssignablePaymentType =
  "payment";
const DEFAULT_STANDALONE_PAYMENT_TYPE: SyncedPaymentStandalonePaymentType =
  "other";
const DEFAULT_MATCH_WINDOW_MINUTES = 120;
const MAX_SUGGESTIONS = 5;

/**
 * Computes the outstanding service balance of an appointment, using the same
 * rules as the canonical balance formula in `get-arguments.ts`: total price
 * minus the net (amount - refunds) of every paid payment that is not a fee or
 * a tip.
 */
const computeRemainingBalance = (appointment: Appointment): number => {
  if (!appointment.totalPrice) {
    return 0;
  }

  const paid = (appointment.payments || [])
    .filter(
      (payment) =>
        payment.status === "paid" &&
        payment.type !== "rescheduleFee" &&
        payment.type !== "cancellationFee" &&
        payment.type !== "tips",
    )
    .reduce((sum, payment) => {
      const refunded = (payment.refunds || []).reduce(
        (acc, refund) => acc + refund.amount,
        0,
      );
      return sum + (payment.amount - refunded);
    }, 0);

  return round2(appointment.totalPrice - paid);
};

export class SyncedPaymentsService
  extends BaseService
  implements ISyncedPaymentsService
{
  public constructor(
    organizationId: string,
    protected readonly bookingService: IBookingService,
    protected readonly paymentsService: IPaymentsService,
    protected readonly customersService: ICustomersService,
    protected readonly eventService: IEventService,
  ) {
    super("SyncedPaymentsService", organizationId);
  }

  public async getReviewQueueCount(): Promise<number> {
    const db = await getDbConnection();
    const collection = db.collection<SyncedPayment>(
      SYNCED_PAYMENTS_COLLECTION_NAME,
    );
    return collection.countDocuments({
      organizationId: this.organizationId,
      status: { $in: ["matched", "unmatched"] satisfies SyncedPaymentStatus[] },
    });
  }

  public async ingest(
    transaction: SyncedPaymentTransaction,
    source: EventSource,
    options?: IngestSyncedPaymentOptions,
  ): Promise<SyncedPayment> {
    const logger = this.loggerFactory("ingest");
    const matchWindowMinutes =
      options?.matchWindowMinutes ?? DEFAULT_MATCH_WINDOW_MINUTES;

    logger.debug(
      {
        appId: transaction.appId,
        appName: transaction.appName,
        externalId: transaction.externalId,
        orderId: transaction.orderId,
        amount: transaction.amount,
        currency: transaction.currency,
        transactionTime: transaction.transactionTime,
        feeCount: transaction.fees?.length ?? 0,
        matchWindowMinutes,
        source,
      },
      "Ingesting synced payment",
    );

    // Idempotency: a provider transaction is processed at most once.
    const existing = await this.getRaw(transaction.externalId);
    if (existing) {
      logger.info(
        {
          externalId: transaction.externalId,
          id: existing._id,
          status: existing.status,
        },
        "Synced payment already ingested, skipping",
      );
      return existing;
    }

    const suggestions = await this.findCandidates(
      transaction,
      matchWindowMinutes,
    );

    const best = suggestions[0];

    if (!best) {
      logger.info(
        {
          externalId: transaction.externalId,
          amount: transaction.amount,
          transactionTime: transaction.transactionTime,
          matchWindowMinutes,
          suggestionCount: 0,
        },
        "No candidate appointment found, parking in unmatched queue",
      );
      const record = await this.insert({
        ...transaction,
        status: "unmatched",
        suggestions,
      });
      logger.debug(
        {
          id: record._id,
          externalId: record.externalId,
          status: record.status,
        },
        "Synced payment inserted as unmatched",
      );
      await this.eventService.emit(
        SYNCED_PAYMENT_INGESTED_EVENT_TYPE,
        { syncedPayment: record } satisfies SyncedPaymentIngestedPayload,
        source,
      );
      return record;
    }

    logger.info(
      {
        externalId: transaction.externalId,
        appointmentId: best.appointmentId,
        score: best.score,
        reason: best.reason,
        suggestionCount: suggestions.length,
        topSuggestions: suggestions.slice(0, 3).map((s) => ({
          appointmentId: s.appointmentId,
          score: s.score,
          reason: s.reason,
        })),
      },
      "Auto-attaching synced payment to best candidate",
    );

    const { paymentIds, customerId, split } =
      await this.createPaymentsForAppointment(
        best.appointmentId,
        transaction,
        source,
      );

    const record = await this.insert({
      ...transaction,
      status: "matched",
      appointmentId: best.appointmentId,
      customerId,
      paymentIds,
      paymentAmount: split.paymentAmount,
      inferredTip: split.tip,
      paymentType: DEFAULT_SYNCED_PAYMENT_TYPE,
      originalAmount: split.paymentAmount,
      originalTip: split.tip,
      originalPaymentType: DEFAULT_SYNCED_PAYMENT_TYPE,
      suggestions,
    });

    logger.info(
      {
        id: record._id,
        externalId: record.externalId,
        appointmentId: record.appointmentId,
        paymentIds,
        paymentAmount: split.paymentAmount,
        inferredTip: split.tip,
      },
      "Synced payment ingested and matched",
    );

    await this.eventService.emit(
      SYNCED_PAYMENT_INGESTED_EVENT_TYPE,
      { syncedPayment: record } satisfies SyncedPaymentIngestedPayload,
      source,
    );

    return record;
  }

  public async list(
    query: Query & {
      status?: SyncedPaymentStatus[];
      range?: DateRange;
      externalId?: string;
    },
  ): Promise<WithTotal<HydratedSyncedPayment>> {
    const logger = this.loggerFactory("list");
    logger.debug({ query }, "Listing synced payments");

    const db = await getDbConnection();
    const collection = db.collection<SyncedPayment>(
      SYNCED_PAYMENTS_COLLECTION_NAME,
    );

    const filter: Filter<SyncedPayment> = {
      organizationId: this.organizationId,
    };
    if (query.externalId) {
      filter.externalId = query.externalId;
    }
    if (query.status && query.status.length) {
      filter.status = { $in: query.status };
    }
    if (query.range?.start || query.range?.end) {
      const transactionTime: Record<string, Date> = {};
      if (query.range.start) {
        transactionTime.$gte = query.range.start;
      }
      if (query.range.end) {
        transactionTime.$lte = query.range.end;
      }
      (filter as Record<string, unknown>).transactionTime = transactionTime;
    }

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({ ...prev, [curr.id]: curr.desc ? -1 : 1 }),
      {},
    ) || { createdAt: -1 };

    const total = await collection.countDocuments(filter);

    const items = await collection
      .find(filter)
      .sort(sort)
      .skip(query.offset || 0)
      .limit(query.limit || 50)
      .toArray();

    const hydrated = await Promise.all(items.map((item) => this.hydrate(item)));

    logger.debug(
      {
        total,
        count: hydrated.length,
        offset: query.offset,
        limit: query.limit,
      },
      "Listed synced payments",
    );

    return { items: hydrated, total };
  }

  public async get(id: string): Promise<HydratedSyncedPayment | null> {
    const logger = this.loggerFactory("get");
    logger.debug({ id }, "Getting synced payment");

    const db = await getDbConnection();
    const collection = db.collection<SyncedPayment>(
      SYNCED_PAYMENTS_COLLECTION_NAME,
    );

    const item = await collection.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!item) {
      logger.warn({ id }, "Synced payment not found");
      return null;
    }

    logger.debug(
      { id, status: item.status, externalId: item.externalId },
      "Synced payment retrieved",
    );

    return this.hydrate(item);
  }

  public async confirm(
    id: string,
    source: EventSource,
  ): Promise<SyncedPayment> {
    const logger = this.loggerFactory("confirm");
    logger.debug({ id }, "Confirming synced payment");
    const existing = await this.getById(id);
    const originals = this.resolveStoredOriginals(existing);
    const record = await this.update(id, {
      status: "confirmed",
      ...(existing.originalAmount === undefined ||
      existing.originalTip === undefined
        ? {
            originalAmount: originals.originalAmount,
            originalTip: originals.originalTip,
            originalPaymentType: originals.originalPaymentType,
          }
        : {}),
    });
    logger.info(
      {
        id,
        externalId: record.externalId,
        appointmentId: record.appointmentId,
      },
      "Synced payment confirmed",
    );
    await this.eventService.emit(
      SYNCED_PAYMENT_CONFIRMED_EVENT_TYPE,
      { syncedPayment: record } satisfies SyncedPaymentConfirmedPayload,
      source,
    );
    return record;
  }

  public async confirmAllMatched(
    source: EventSource,
    query?: { range?: DateRange; externalId?: string },
  ): Promise<{ count: number }> {
    const logger = this.loggerFactory("confirmAllMatched");
    logger.debug({ query }, "Confirming all matched synced payments");

    const db = await getDbConnection();
    const collection = db.collection<SyncedPayment>(
      SYNCED_PAYMENTS_COLLECTION_NAME,
    );

    const filter: Filter<SyncedPayment> = {
      organizationId: this.organizationId,
      status: "matched",
    };

    if (query?.externalId) {
      filter.externalId = query.externalId;
    }

    if (query?.range?.start || query?.range?.end) {
      const transactionTime: Record<string, Date> = {};
      if (query.range.start) {
        transactionTime.$gte = query.range.start;
      }
      if (query.range.end) {
        transactionTime.$lte = query.range.end;
      }
      (filter as Record<string, unknown>).transactionTime = transactionTime;
    }

    const items = await collection.find(filter).toArray();

    let count = 0;
    for (const item of items) {
      await this.confirm(item._id, source);
      count += 1;
    }

    logger.info({ count, query }, "Confirmed all matched synced payments");
    return { count };
  }

  public async reject(id: string, source: EventSource): Promise<SyncedPayment> {
    const logger = this.loggerFactory("reject");
    logger.debug({ id, source }, "Rejecting synced payment");

    const record = await this.getById(id);
    await this.removePayments(record, source);
    const updated = await this.update(id, {
      status: "rejected",
      appointmentId: undefined,
      customerId: undefined,
      paymentIds: [],
      inferredTip: 0,
    });

    logger.info(
      {
        id,
        externalId: updated.externalId,
        removedPaymentIds: record.paymentIds,
      },
      "Synced payment rejected",
    );
    await this.eventService.emit(
      SYNCED_PAYMENT_REJECTED_EVENT_TYPE,
      { syncedPayment: updated } satisfies SyncedPaymentRejectedPayload,
      source,
    );
    return updated;
  }

  public async reassign(
    id: string,
    appointmentId: string,
    source: EventSource,
  ): Promise<SyncedPayment> {
    const logger = this.loggerFactory("reassign");
    logger.debug({ id, appointmentId, source }, "Reassigning synced payment");

    const record = await this.getById(id);

    await this.removePayments(record, source);

    const { paymentIds, customerId, split } =
      await this.createPaymentsForAppointment(appointmentId, record, source);

    const paymentType = record.paymentType ?? DEFAULT_SYNCED_PAYMENT_TYPE;

    const updated = await this.update(id, {
      appointmentId,
      customerId,
      paymentIds,
      paymentAmount: split.paymentAmount,
      inferredTip: split.tip,
      originalAmount: split.paymentAmount,
      originalTip: split.tip,
      ...(record.status === "unmatched" || record.status === "ignored"
        ? { status: "matched" as const }
        : {}),
      ...(record.paymentType == null ? { paymentType } : {}),
      ...(record.originalPaymentType == null
        ? { originalPaymentType: paymentType }
        : {}),
    });

    logger.info(
      {
        id,
        externalId: updated.externalId,
        fromAppointmentId: record.appointmentId,
        toAppointmentId: appointmentId,
        paymentIds,
        paymentAmount: split.paymentAmount,
        inferredTip: split.tip,
      },
      record.appointmentId
        ? "Synced payment reassigned"
        : "Synced payment assigned",
    );
    await this.eventService.emit(
      SYNCED_PAYMENT_ASSIGNED_EVENT_TYPE,
      {
        syncedPayment: updated,
        previousAppointmentId: record.appointmentId,
      } satisfies SyncedPaymentAssignedPayload,
      source,
    );
    return updated;
  }

  public async assign(
    id: string,
    appointmentId: string,
    source: EventSource,
  ): Promise<SyncedPayment> {
    const logger = this.loggerFactory("assign");
    logger.debug({ id, appointmentId, source }, "Assigning synced payment");
    return this.reassign(id, appointmentId, source);
  }

  public async unassign(
    id: string,
    source: EventSource,
  ): Promise<SyncedPayment> {
    const logger = this.loggerFactory("unassign");
    logger.debug({ id, source }, "Unassigning synced payment");

    const record = await this.getById(id);
    if (!record.appointmentId) {
      logger.warn(
        { id, externalId: record.externalId },
        "Cannot unassign a synced payment that has no appointment",
      );
      throw new Error("Synced payment is not assigned to an appointment");
    }

    const previousAppointmentId = record.appointmentId;
    await this.removePayments(record, source);
    const updated = await this.update(id, {
      status: "unmatched",
      appointmentId: undefined,
      customerId: undefined,
      paymentIds: [],
      paymentAmount: undefined,
      inferredTip: undefined,
      paymentType: undefined,
      originalAmount: undefined,
      originalTip: undefined,
      originalPaymentType: undefined,
    });

    logger.info(
      {
        id,
        externalId: updated.externalId,
        previousAppointmentId,
        removedPaymentIds: record.paymentIds,
      },
      "Synced payment unassigned",
    );
    await this.eventService.emit(
      SYNCED_PAYMENT_UNASSIGNED_EVENT_TYPE,
      {
        syncedPayment: updated,
        previousAppointmentId,
      } satisfies SyncedPaymentUnassignedPayload,
      source,
    );
    return updated;
  }

  public async ignore(id: string, source: EventSource): Promise<SyncedPayment> {
    const logger = this.loggerFactory("ignore");
    logger.debug({ id, source }, "Ignoring synced payment");

    const record = await this.getById(id);
    await this.removePayments(record, source);
    const updated = await this.update(id, {
      status: "ignored",
      appointmentId: undefined,
      customerId: undefined,
      paymentIds: [],
      inferredTip: 0,
    });

    logger.info(
      {
        id,
        externalId: updated.externalId,
        removedPaymentIds: record.paymentIds,
      },
      "Synced payment ignored",
    );
    await this.eventService.emit(
      SYNCED_PAYMENT_IGNORED_EVENT_TYPE,
      { syncedPayment: updated } satisfies SyncedPaymentIgnoredPayload,
      source,
    );
    return updated;
  }

  public async recordStandalone(
    id: string,
    details: {
      customerId: string;
      paymentType: SyncedPaymentStandalonePaymentType;
    },
    source: EventSource,
  ): Promise<SyncedPayment> {
    const logger = this.loggerFactory("recordStandalone");
    const paymentType = details.paymentType ?? DEFAULT_STANDALONE_PAYMENT_TYPE;
    logger.debug(
      { id, customerId: details.customerId, paymentType, source },
      "Recording synced payment without an appointment",
    );

    const record = await this.getById(id);

    if (record.appointmentId) {
      logger.warn(
        {
          id,
          externalId: record.externalId,
          appointmentId: record.appointmentId,
        },
        "Cannot record a synced payment that is already assigned to an appointment",
      );

      throw new Error(
        "Unassign from the appointment before recording as a standalone payment",
      );
    }

    const customer = await this.customersService.getCustomer(
      details.customerId,
    );
    if (!customer) {
      logger.warn(
        { id, customerId: details.customerId },
        "Customer not found for standalone synced payment",
      );

      throw new Error(`Customer ${details.customerId} not found`);
    }

    await this.removePayments(record, source);

    const paymentAmount = round2(Math.max(0, record.amount));
    const paymentIds: string[] = [];

    if (paymentAmount > 0) {
      const payment: PaymentUpdateModel = {
        amount: paymentAmount,
        status: "paid",
        paidAt: record.transactionTime,
        customerId: details.customerId,
        description: "syncedPayment",
        type: paymentType,
        method: "in-person-card",
        source: "synced",
        disableUpdate: true,
        externalId: record.externalId,
        appName: record.appName,
        appId: record.appId,
        fees: record.fees,
      };

      const created = await this.paymentsService.createPayment(payment, source);
      paymentIds.push(created._id);
    }

    const updated = await this.update(id, {
      status: "confirmed",
      customerId: details.customerId,
      paymentIds,
      paymentAmount,
      inferredTip: 0,
      paymentType,
      originalAmount: paymentAmount,
      originalTip: 0,
      originalPaymentType: paymentType,
    });

    logger.info(
      {
        id,
        externalId: updated.externalId,
        customerId: details.customerId,
        paymentType,
        paymentIds,
        paymentAmount,
      },
      "Synced payment recorded as standalone",
    );

    await this.eventService.emit(
      SYNCED_PAYMENT_CONFIRMED_EVENT_TYPE,
      { syncedPayment: updated } satisfies SyncedPaymentConfirmedPayload,
      source,
    );

    return updated;
  }

  public async unrecord(
    id: string,
    source: EventSource,
  ): Promise<SyncedPayment> {
    const logger = this.loggerFactory("unrecord");
    logger.debug({ id, source }, "Removing standalone synced payment record");

    const record = await this.getById(id);

    if (record.appointmentId) {
      logger.warn(
        {
          id,
          externalId: record.externalId,
          appointmentId: record.appointmentId,
        },
        "Cannot unrecord a synced payment that is assigned to an appointment",
      );
      throw new Error(
        "Unassign from the appointment instead of removing a customer record",
      );
    }

    if (!record.customerId || record.status !== "confirmed") {
      logger.warn(
        {
          id,
          externalId: record.externalId,
          customerId: record.customerId,
          status: record.status,
        },
        "Cannot unrecord a synced payment that is not recorded to a customer",
      );
      throw new Error("Synced payment is not recorded to a customer");
    }

    const previousCustomerId = record.customerId;
    await this.removePayments(record, source);
    const updated = await this.update(id, {
      status: "unmatched",
      customerId: undefined,
      paymentIds: [],
      paymentAmount: undefined,
      inferredTip: undefined,
      paymentType: undefined,
      originalAmount: undefined,
      originalTip: undefined,
      originalPaymentType: undefined,
    });

    logger.info(
      {
        id,
        externalId: updated.externalId,
        previousCustomerId,
        removedPaymentIds: record.paymentIds,
      },
      "Synced payment record removed",
    );
    await this.eventService.emit(
      SYNCED_PAYMENT_UNRECORDED_EVENT_TYPE,
      {
        syncedPayment: updated,
        previousCustomerId,
      } satisfies SyncedPaymentUnrecordedPayload,
      source,
    );
    return updated;
  }

  public async updateAmounts(
    id: string,
    amounts: {
      paymentAmount: number;
      tip: number;
      paymentType: SyncedPaymentAssignablePaymentType;
    },
    source: EventSource,
  ): Promise<SyncedPayment> {
    const logger = this.loggerFactory("updateAmounts");
    logger.debug({ id, amounts, source }, "Updating synced payment amounts");

    const record = await this.getById(id);

    if (!record.appointmentId) {
      logger.warn(
        { id, externalId: record.externalId },
        "Cannot edit amounts without an appointment",
      );
      throw new Error(
        "Cannot edit amounts of a synced payment without an appointment",
      );
    }

    const paymentAmount = round2(Math.max(0, amounts.paymentAmount));
    const tip = round2(Math.max(0, amounts.tip));
    const paymentType = amounts.paymentType;

    logger.debug(
      {
        id,
        appointmentId: record.appointmentId,
        previousPaymentAmount: record.paymentAmount,
        previousTip: record.inferredTip,
        previousPaymentType: record.paymentType,
        paymentAmount,
        tip,
        paymentType,
      },
      "Recreating linked payments with new amounts",
    );

    // Recreate the linked payment records so they reflect the new split.
    await this.removePayments(record, source);
    const { paymentIds, customerId } = await this.createPaymentsForAppointment(
      record.appointmentId,
      record,
      source,
      { paymentAmount, tip, paymentType },
    );

    const originals = this.resolveStoredOriginals(record);

    const updated = await this.update(id, {
      paymentIds,
      customerId,
      paymentAmount,
      inferredTip: tip,
      paymentType,
      originalAmount: originals.originalAmount,
      originalTip: originals.originalTip,
      originalPaymentType: originals.originalPaymentType,
    });

    logger.info(
      {
        id,
        externalId: updated.externalId,
        appointmentId: record.appointmentId,
        paymentAmount,
        tip,
        paymentType,
        paymentIds,
        originalAmount: originals.originalAmount,
        originalTip: originals.originalTip,
        originalPaymentType: originals.originalPaymentType,
      },
      "Synced payment amounts updated",
    );
    await this.eventService.emit(
      SYNCED_PAYMENT_AMOUNTS_UPDATED_EVENT_TYPE,
      {
        syncedPayment: updated,
        previousPaymentAmount: record.paymentAmount,
        previousTip: record.inferredTip,
      } satisfies SyncedPaymentAmountsUpdatedPayload,
      source,
    );
    return updated;
  }

  public async revertAmounts(
    id: string,
    source: EventSource,
  ): Promise<SyncedPayment> {
    const logger = this.loggerFactory("revertAmounts");
    logger.debug({ id, source }, "Reverting synced payment amounts");

    const record = await this.getById(id);

    if (
      record.originalAmount === undefined ||
      record.originalTip === undefined
    ) {
      logger.warn(
        { id, externalId: record.externalId },
        "Cannot revert synced payment without stored original amounts",
      );
      throw new Error(
        "Cannot revert synced payment amounts: original split was not recorded",
      );
    }

    const paymentAmount = record.originalAmount;
    const tip = record.originalTip;
    const paymentType =
      record.originalPaymentType ??
      record.paymentType ??
      DEFAULT_SYNCED_PAYMENT_TYPE;

    logger.debug(
      {
        id,
        externalId: record.externalId,
        currentPaymentAmount: record.paymentAmount,
        currentTip: record.inferredTip,
        currentPaymentType: record.paymentType,
        revertPaymentAmount: paymentAmount,
        revertTip: tip,
        revertPaymentType: paymentType,
      },
      "Reverting to original amounts",
    );

    return this.updateAmounts(id, { paymentAmount, tip, paymentType }, source);
  }

  /**
   * Returns the persisted original split, or snapshots the current split when
   * originals were never stored (legacy records).
   */
  private resolveStoredOriginals(record: SyncedPayment): {
    originalAmount: number;
    originalTip: number;
    originalPaymentType: SyncedPaymentAssignablePaymentType;
  } {
    const tip = record.inferredTip ?? 0;
    const paymentAmount = record.paymentAmount ?? round2(record.amount - tip);

    return {
      originalAmount: record.originalAmount ?? paymentAmount,
      originalTip: record.originalTip ?? tip,
      originalPaymentType:
        record.originalPaymentType ??
        record.paymentType ??
        DEFAULT_SYNCED_PAYMENT_TYPE,
    };
  }

  private async findCandidates(
    transaction: SyncedPaymentTransaction,
    matchWindowMinutes: number,
  ): Promise<SyncedPaymentSuggestion[]> {
    const logger = this.loggerFactory("findCandidates");
    const windowMs = matchWindowMinutes * 60 * 1000;
    const txTime = transaction.transactionTime.getTime();

    const endRange = {
      start: new Date(txTime - windowMs),
      end: new Date(txTime + windowMs),
    };

    logger.debug(
      {
        externalId: transaction.externalId,
        amount: transaction.amount,
        transactionTime: transaction.transactionTime,
        matchWindowMinutes,
        endRange,
      },
      "Searching for appointment match candidates",
    );

    const { items } = await this.bookingService.getAppointments({
      endRange,
      status: ["confirmed", "pending"],
      limit: 100,
    });

    logger.debug(
      { externalId: transaction.externalId, appointmentCount: items.length },
      "Appointments fetched in match window",
    );

    const suggestions: SyncedPaymentSuggestion[] = [];
    let skippedNoBalance = 0;
    let skippedOutsideWindow = 0;

    for (const appointment of items) {
      const remaining = computeRemainingBalance(appointment);
      if (remaining <= 0) {
        skippedNoBalance++;
        continue;
      }

      const endTime =
        appointment.endAt?.getTime() ??
        appointment.dateTime.getTime() +
          (appointment.totalDuration ?? 0) * 60 * 1000;
      const diffMs = Math.abs(endTime - txTime);
      if (diffMs > windowMs) {
        skippedOutsideWindow++;
        continue;
      }

      const timeScore = 1 - diffMs / windowMs;

      let amountScore: number;
      let reason: string;
      if (Math.abs(transaction.amount - remaining) < 0.01) {
        amountScore = 1;
        reason = "exact_balance";
      } else if (transaction.amount < remaining) {
        amountScore = 0.6 * (transaction.amount / remaining);
        reason = "partial_balance";
      } else {
        // Overpayment is treated as a tip; modest tips score well.
        const tipRatio = (transaction.amount - remaining) / remaining;
        amountScore = tipRatio <= 0.5 ? 0.9 - tipRatio * 0.4 : 0.3;
        reason = "balance_with_tip";
      }

      const score = round2(timeScore * 0.5 + amountScore * 0.5);
      suggestions.push({ appointmentId: appointment._id, score, reason });
    }

    const ranked = suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SUGGESTIONS);

    logger.debug(
      {
        externalId: transaction.externalId,
        skippedNoBalance,
        skippedOutsideWindow,
        candidateCount: suggestions.length,
        topSuggestions: ranked.map((s) => ({
          appointmentId: s.appointmentId,
          score: s.score,
          reason: s.reason,
        })),
      },
      "Match candidates ranked",
    );

    return ranked;
  }

  /**
   * Default split of a transaction: as much as the remaining balance goes to
   * the service payment; any overpayment becomes a tip.
   */
  private computeDefaultSplit(
    appointment: Appointment,
    totalAmount: number,
  ): { paymentAmount: number; tip: number } {
    const remaining = Math.max(0, computeRemainingBalance(appointment));
    const paymentAmount = round2(Math.min(totalAmount, remaining));
    const tip = round2(totalAmount - paymentAmount);
    return { paymentAmount, tip };
  }

  private async createPaymentsForAppointment(
    appointmentId: string,
    transaction: SyncedPaymentTransaction & {
      paymentType?: SyncedPaymentAssignablePaymentType;
    },
    source: EventSource,
    override?: {
      paymentAmount: number;
      tip: number;
      paymentType?: SyncedPaymentAssignablePaymentType;
    },
  ): Promise<{
    paymentIds: string[];
    customerId: string;
    split: { paymentAmount: number; tip: number };
  }> {
    const logger = this.loggerFactory("createPaymentsForAppointment");
    logger.debug(
      {
        appointmentId,
        externalId: transaction.externalId,
        amount: transaction.amount,
        override,
        source,
      },
      "Creating payments for appointment from synced transaction",
    );

    const appointment = await this.bookingService.getAppointment(appointmentId);
    if (!appointment) {
      logger.warn(
        { appointmentId },
        "Appointment not found for synced payment",
      );
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    const split =
      override ??
      (transaction.providerSplit
        ? {
            paymentAmount: round2(
              Math.max(0, transaction.providerSplit.paymentAmount),
            ),
            tip: round2(Math.max(0, transaction.providerSplit.tip)),
          }
        : this.computeDefaultSplit(appointment, transaction.amount));
    const paymentAmount = round2(Math.max(0, split.paymentAmount));
    const inferredTip = round2(Math.max(0, split.tip));
    const servicePaymentType =
      override?.paymentType ??
      transaction.paymentType ??
      DEFAULT_SYNCED_PAYMENT_TYPE;

    const paymentIds: string[] = [];

    if (paymentAmount > 0) {
      const payment: PaymentUpdateModel = {
        amount: paymentAmount,
        status: "paid",
        paidAt: transaction.transactionTime,
        appointmentId,
        customerId: appointment.customerId,
        description: "syncedPayment",
        type: servicePaymentType,
        method: "in-person-card",
        source: "synced",
        // Synced payments can only be changed through the synced payment record,
        // never edited/deleted directly from the appointment payments UI/API.
        disableUpdate: true,
        externalId: transaction.externalId,
        appName: transaction.appName,
        appId: transaction.appId,
        fees: transaction.fees,
      };
      const created = await this.paymentsService.createPayment(payment, source);
      paymentIds.push(created._id);
    }

    if (inferredTip > 0) {
      const tipPayment: PaymentUpdateModel = {
        amount: inferredTip,
        status: "paid",
        paidAt: transaction.transactionTime,
        appointmentId,
        customerId: appointment.customerId,
        description: "syncedTip",
        type: "tips",
        method: "in-person-card",
        source: "synced",
        disableUpdate: true,
        externalId: transaction.externalId,
        appName: transaction.appName,
        appId: transaction.appId,
      };
      const created = await this.paymentsService.createPayment(
        tipPayment,
        source,
      );
      paymentIds.push(created._id);
    }

    logger.debug(
      {
        appointmentId,
        externalId: transaction.externalId,
        paymentIds,
        paymentAmount,
        inferredTip,
      },
      "Created linked payments for synced transaction",
    );

    return {
      paymentIds,
      customerId: appointment.customerId,
      split: { paymentAmount, tip: inferredTip },
    };
  }

  private async removePayments(
    record: SyncedPayment,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("removePayments");
    const paymentIds = record.paymentIds || [];

    if (!paymentIds.length) {
      logger.debug(
        { id: record._id, externalId: record.externalId },
        "No linked payments to remove",
      );
      return;
    }

    logger.debug(
      {
        id: record._id,
        externalId: record.externalId,
        paymentIds,
        source,
      },
      "Removing linked payments",
    );

    for (const paymentId of paymentIds) {
      await this.paymentsService.deletePayment(paymentId, source);
    }

    logger.debug(
      {
        id: record._id,
        externalId: record.externalId,
        count: paymentIds.length,
      },
      "Linked payments removed",
    );
  }

  private async hydrate(record: SyncedPayment): Promise<HydratedSyncedPayment> {
    const appointment = record.appointmentId
      ? ((await this.bookingService.getAppointment(record.appointmentId)) ??
        undefined)
      : undefined;

    const customer = appointment?.customer
      ? appointment.customer
      : record.customerId
        ? ((await this.customersService.getCustomer(record.customerId)) ??
          undefined)
        : undefined;

    const suggestions = record.suggestions
      ? await Promise.all(
          record.suggestions.map(async (suggestion) => ({
            ...suggestion,
            appointment:
              (await this.bookingService.getAppointment(
                suggestion.appointmentId,
              )) ?? undefined,
          })),
        )
      : undefined;

    return { ...record, appointment, customer, suggestions };
  }

  private async getRaw(externalId: string): Promise<SyncedPayment | null> {
    const db = await getDbConnection();
    const collection = db.collection<SyncedPayment>(
      SYNCED_PAYMENTS_COLLECTION_NAME,
    );
    return collection.findOne({
      externalId,
      organizationId: this.organizationId,
    });
  }

  private async getById(id: string): Promise<SyncedPayment> {
    const logger = this.loggerFactory("getById");
    const db = await getDbConnection();
    const collection = db.collection<SyncedPayment>(
      SYNCED_PAYMENTS_COLLECTION_NAME,
    );
    const record = await collection.findOne({
      _id: id,
      organizationId: this.organizationId,
    });
    if (!record) {
      logger.warn({ id }, "Synced payment not found");
      throw new Error(`Synced payment ${id} not found`);
    }
    return record;
  }

  private async insert(
    model: Omit<
      SyncedPayment,
      "_id" | "organizationId" | "createdAt" | "updatedAt"
    >,
  ): Promise<SyncedPayment> {
    const logger = this.loggerFactory("insert");
    const db = await getDbConnection();
    const collection = db.collection<SyncedPayment>(
      SYNCED_PAYMENTS_COLLECTION_NAME,
    );

    const now = new Date();
    const record: SyncedPayment = {
      ...model,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      createdAt: now,
      updatedAt: now,
    };

    logger.debug(
      {
        externalId: record.externalId,
        status: record.status,
        appointmentId: record.appointmentId,
        amount: record.amount,
      },
      "Inserting synced payment",
    );

    try {
      await collection.insertOne(record);
    } catch (error: any) {
      // Unique index race on (organizationId, externalId): return the winner.
      if (error?.code === 11000) {
        logger.info(
          { externalId: record.externalId },
          "Duplicate key on insert, returning existing record",
        );
        const existing = await this.getRaw(record.externalId);
        if (existing) {
          return existing;
        }
      }
      logger.error(
        { externalId: record.externalId, err: error },
        "Failed to insert synced payment",
      );
      throw error;
    }

    logger.debug(
      { id: record._id, externalId: record.externalId, status: record.status },
      "Synced payment inserted",
    );

    return record;
  }

  private async update(
    id: string,
    update: Partial<SyncedPayment>,
  ): Promise<SyncedPayment> {
    const logger = this.loggerFactory("update");
    logger.debug({ id, update }, "Updating synced payment");

    const db = await getDbConnection();
    const collection = db.collection<SyncedPayment>(
      SYNCED_PAYMENTS_COLLECTION_NAME,
    );

    const { _id: _, organizationId: __, ...rest } = update as SyncedPayment;

    const toSet: Record<string, unknown> = { updatedAt: new Date() };
    const toUnset: Record<string, ""> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value === undefined) {
        toUnset[key] = "";
      } else {
        toSet[key] = value;
      }
    }

    const mongoUpdate: UpdateFilter<SyncedPayment> = { $set: toSet };
    if (Object.keys(toUnset).length) {
      mongoUpdate.$unset = toUnset;
    }

    const result = await collection.updateOne(
      { _id: id, organizationId: this.organizationId },
      mongoUpdate,
    );

    if (result.matchedCount === 0) {
      logger.warn({ id }, "Synced payment not found for update");
    } else {
      logger.debug(
        { id, modifiedCount: result.modifiedCount },
        "Synced payment updated",
      );
    }

    return this.getById(id);
  }
}
