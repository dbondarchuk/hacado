import { WithDatabaseId, WithOrganizationId } from "../database";
import { Prettify } from "../utils/helpers";
import { Appointment } from "./appointment";
import { PaymentFee, PaymentType } from "./payment";

/** Payment types staff can assign to the non-tip portion of a synced payment. */
export const syncedPaymentAssignablePaymentTypes = [
  "deposit",
  "rescheduleFee",
  "cancellationFee",
  "payment",
  "other",
] as const satisfies readonly PaymentType[];

export type SyncedPaymentAssignablePaymentType =
  (typeof syncedPaymentAssignablePaymentTypes)[number];

export const syncedPaymentStatus = [
  /** Attached to an appointment (auto-match or staff assign), awaiting staff review. */
  "matched",
  /** No candidate appointment found; waiting in the review queue. */
  "unmatched",
  /** Staff confirmed the (re)assignment. */
  "confirmed",
  /** Staff rejected the match; created payments were removed. */
  "rejected",
  /** Staff dismissed the transaction without assigning it. */
  "ignored",
] as const;

export type SyncedPaymentStatus = (typeof syncedPaymentStatus)[number];

export type SyncedPaymentSuggestion = {
  appointmentId: string;
  /** Higher is a better match. */
  score: number;
  /** Short machine-readable reason describing why this appointment matched. */
  reason?: string;
};

/**
 * Normalized in-store transaction handed to the matcher by a payment app
 * (e.g. PayPal) so the matching logic stays provider-agnostic.
 */
export type SyncedPaymentTransaction = {
  appId: string;
  appName: string;
  /** Provider capture/transaction id. Used for dedup. */
  externalId: string;
  /** Provider order id, when applicable (used for online-vs-in-store detection). */
  orderId?: string;
  amount: number;
  currency: string;
  transactionTime: Date;
  fees?: PaymentFee[];
  /** Raw provider payload, kept for auditing/debugging. */
  raw?: unknown;
  /**
   * When the provider separates line items from tips (e.g. PayPal cart_info),
   * use this split instead of inferring tip from appointment balance alone.
   */
  providerSplit?: { paymentAmount: number; tip: number };
};

export type SyncedPaymentUpdateModel = SyncedPaymentTransaction & {
  status: SyncedPaymentStatus;
  appointmentId?: string;
  customerId?: string;
  /** Ids of the payment records created when matched (service payment + tip). */
  paymentIds?: string[];
  /**
   * Current service-payment amount applied to the appointment balance.
   * Editable by staff; reflected on the linked payment record.
   */
  paymentAmount?: number;
  /**
   * Current amount split off as a tip. Editable by staff (can be set to 0 to
   * remove the tip); reflected on the linked tip payment record.
   */
  inferredTip?: number;
  /** Originally computed service-payment amount, kept so edits can be reverted. */
  originalAmount?: number;
  /** Originally computed tip, kept so edits can be reverted. */
  originalTip?: number;
  /** Type applied to the non-tip linked payment record. */
  paymentType?: SyncedPaymentAssignablePaymentType;
  /** Originally applied payment type, kept so edits can be reverted. */
  originalPaymentType?: SyncedPaymentAssignablePaymentType;
  suggestions?: SyncedPaymentSuggestion[];
};

export type SyncedPayment = Prettify<
  WithOrganizationId<
    WithDatabaseId<
      SyncedPaymentUpdateModel & {
        createdAt: Date;
        updatedAt: Date;
      }
    >
  >
>;

/** Suggestion enriched with the candidate appointment for display. */
export type SyncedPaymentSuggestionWithAppointment = SyncedPaymentSuggestion & {
  appointment?: Appointment;
};

/** A synced payment hydrated with its appointment and suggestion details. */
export type HydratedSyncedPayment = Prettify<
  Omit<SyncedPayment, "suggestions"> & {
    appointment?: Appointment;
    suggestions?: SyncedPaymentSuggestionWithAppointment[];
  }
>;
