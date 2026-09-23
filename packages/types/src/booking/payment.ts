import * as z from "zod";
import { WithDatabaseId, WithOrganizationId } from "../database";
import { zObjectId } from "../utils";
import { Prettify } from "../utils/helpers";
import {
  AppointmentRequest,
  appointmentRequestSchema,
  ModifyAppointmentRequest,
  modifyAppointmentRequestSchema,
} from "./appointment-event";

export const paymentType = [
  "deposit",
  "rescheduleFee",
  "cancellationFee",
  "payment",
  "tips",
  "other",
] as const;

export type PaymentType = (typeof paymentType)[number];
export const paymentTypeSchema = z.enum(paymentType);

export const paymentFeeType = ["transaction", "platform", "other"] as const;
export type PaymentFeeType = (typeof paymentFeeType)[number];

export type PaymentFee = {
  type: PaymentFeeType;
  amount: number;
};

export type PaymentIntentStatus = "created" | "failed" | "paid";
export type PaymentIntentUpdateModel = {
  amount: number;
  customerId?: string;
  appId: string;
  appName: string;
  status: PaymentIntentStatus;
  appointmentId?: string;
  externalId?: string;
  error?: string;
  fees?: PaymentFee[];
  data?: Record<string, any>;
} & (
  | {
      type: Exclude<PaymentType, "rescheduleFee" | "cancellationFee">;
      request: AppointmentRequest;
    }
  | {
      type: Extract<PaymentType, "rescheduleFee" | "cancellationFee">;
      appointmentId: string;
      request: ModifyAppointmentRequest;
    }
  | {
      type: "purchase";
      request: {
        amount: number;
        /** Tip included in the charged amount (same charge). */
        tipAmount?: number;
        /** Optional source for non-booking purchases (gift cards, payment links). */
        source?: "gift-card" | "payment-link";
        sourceId?: string;
      };
    }
);

export const createOrUpdatePaymentIntentRequestSchema = z.discriminatedUnion(
  "type",
  [
    z.object({
      type: paymentTypeSchema.exclude(["rescheduleFee", "cancellationFee"]),
      request: appointmentRequestSchema,
    }),
    z.object({
      type: paymentTypeSchema.extract(["rescheduleFee", "cancellationFee"]),
      appointmentId: zObjectId("appointments.request.appointmentId.required"),
      request: modifyAppointmentRequestSchema,
    }),
  ],
);

export type CreateOrUpdatePaymentIntentRequest = z.infer<
  typeof createOrUpdatePaymentIntentRequestSchema
>;

export type PaymentIntent = Prettify<
  WithOrganizationId<
    WithDatabaseId<
      PaymentIntentUpdateModel & {
        createdAt: Date;
        updatedAt: Date;
        paidAt?: Date;
      }
    >
  >
>;

export type CollectPayment = {
  formProps: Record<string, any>;
  intent: Omit<PaymentIntent, "request">;
  amount: number;
  amountPaid: number;
  amountTotal: number;
  isFixedAmount?: boolean;
  giftCards?: {
    code: string;
    amountApplied: number;
  }[];
};

export const inPersonPaymentMethod = ["cash", "in-person-card"] as const;

export const inPersonPaymentSource = ["manual", "synced"] as const;
export type InPersonPaymentSource = (typeof inPersonPaymentSource)[number];

export const paymentStatus = [
  "pending",
  "paid",
  "refunded",
  "cancelled",
] as const;
export type PaymentStatus = (typeof paymentStatus)[number];

export type OnlinePaymentMethod = "online";
export type InPersonPaymentMethod = (typeof inPersonPaymentMethod)[number];

export const giftCardPaymentMethod = ["gift-card"] as const;
export type GiftCardPaymentMethod = (typeof giftCardPaymentMethod)[number];

export const paymentLinkPaymentMethod = ["payment-link"] as const;
export type PaymentLinkPaymentMethod =
  (typeof paymentLinkPaymentMethod)[number];

export type PaymentMethod =
  | OnlinePaymentMethod
  | InPersonPaymentMethod
  | GiftCardPaymentMethod
  | PaymentLinkPaymentMethod;

export const paymentMethods = [
  ...inPersonPaymentMethod,
  "online",
  ...giftCardPaymentMethod,
  ...paymentLinkPaymentMethod,
] as const satisfies readonly PaymentMethod[];

/** Settled money that should count toward balances and revenue. */
export function isSettledPayment(payment: { status: PaymentStatus }): boolean {
  return payment.status === "paid" || payment.status === "refunded";
}

/**
 * Portion of a payment that applies to appointment balance / service total.
 * Excludes tip included on the same charge (`tipAmount`) and standalone tip rows.
 */
export function getPaymentServiceAmount(payment: {
  amount: number;
  type: PaymentType;
  tipAmount?: number;
}): number {
  if (payment.type === "tips") {
    return 0;
  }

  return Math.max(0, payment.amount - (payment.tipAmount ?? 0));
}

/**
 * Processor identity used to refund an online or paid payment-link charge.
 * Payment-link rows keep `appId` as the payment-links app; the processor is
 * stored on `processorAppId` / `processorAppName` once paid.
 */
export function getPaymentProcessorRefundTarget(payment: {
  method: PaymentMethod;
  externalId?: string;
  appId?: string;
  appName?: string;
  processorAppId?: string;
  processorAppName?: string;
}): { appId: string; appName: string; externalId: string } | null {
  if (payment.method === "online") {
    if (payment.appId && payment.appName && payment.externalId) {
      return {
        appId: payment.appId,
        appName: payment.appName,
        externalId: payment.externalId,
      };
    }

    return null;
  }

  if (payment.method === "payment-link") {
    if (
      payment.processorAppId &&
      payment.processorAppName &&
      payment.externalId
    ) {
      return {
        appId: payment.processorAppId,
        appName: payment.processorAppName,
        externalId: payment.externalId,
      };
    }

    return null;
  }

  return null;
}

export type PaymentUpdateModel = {
  amount: number;
  status: PaymentStatus;
  /** Set when status becomes paid; optional while pending/cancelled. */
  paidAt?: Date;
  createdAt?: Date;
  appointmentId?: string;
  customerId: string;
  description: string;
  type: PaymentType;
  /**
   * Tip included in `amount` on the same charge (e.g. payment link or synced
   * card). Staff can still record a separate cash tip as type `tips`.
   */
  tipAmount?: number;
  fees?: PaymentFee[];
  refunds?: {
    amount: number;
    refundedAt: Date;
  }[];
} & (
  | {
      method: InPersonPaymentMethod;
      disableUpdate?: boolean;
      /**
       * Origin of the in-person payment. `manual` is staff-entered (default),
       * `synced` is ingested from a payment provider (e.g. PayPal in-store).
       */
      source?: InPersonPaymentSource;
      /** Provider transaction/capture id, set for synced payments. */
      externalId?: string;
      /** Provider app name, set for synced payments (e.g. "paypal"). */
      appName?: string;
      /** Connected app id, set for synced payments. */
      appId?: string;
    }
  | {
      method: OnlinePaymentMethod;
      intentId: string;
      externalId?: string;
      appName: string;
      appId: string;
      /** Provider-specific metadata (PayPal stores checkout order id here). */
      data?: { orderId?: string };
    }
  | {
      method: GiftCardPaymentMethod;
      giftCardCode: string;
      giftCardId: string;
    }
  | {
      method: PaymentLinkPaymentMethod;
      /** Connected payment-link app id. */
      appId: string;
      /** Payment-link app slug (e.g. "payment-links"). */
      appName: string;
      /** Unguessable public token used in `/payment?id=`. */
      publicId: string;
      /** Staff member who created the payment link (Better Auth members._id). */
      createdByMemberId?: string;
      /** PaymentIntent id once checkout starts. */
      intentId?: string;
      /** Processor external id once paid. */
      externalId?: string;
      /** Processor app id (default payment app) once paid. */
      processorAppId?: string;
      /** Processor app name once paid. */
      processorAppName?: string;
      expiresAt?: Date;
      /** Last email destination used when sending the link. */
      sentToEmail?: string;
      /** Last phone destination used when sending the link. */
      sentToPhone?: string;
    }
);

export type Payment = Prettify<
  WithOrganizationId<
    WithDatabaseId<
      PaymentUpdateModel & {
        updatedAt: Date;
      }
    >
  >
>;

export type OnlinePayment = Extract<Payment, { method: OnlinePaymentMethod }>;
export type InStorePayment = Extract<
  Payment,
  { method: InPersonPaymentMethod }
>;
export type PaymentLinkPayment = Extract<
  Payment,
  { method: PaymentLinkPaymentMethod }
>;

export const inStorePaymentUpdateModelSchema = z
  .object({
    amount: z.coerce
      .number<number>({ error: "validation.payments.amount.positive" })
      .positive("validation.payments.amount.positive"),
    paidAt: z.coerce.date<Date>({
      error: "validation.payments.paidAt.required",
    }),
    description: z.string().max(1024, "validation.payments.description.max"),
    type: z.enum(paymentType, { error: "validation.payments.type.required" }),
    disableUpdate: z.boolean().optional(),
    customerId: zObjectId("validation.payments.customerId.required"),
    appointmentId: zObjectId().optional(),
  })
  .and(
    z.discriminatedUnion("method", [
      z.object({
        method: z.enum(inPersonPaymentMethod, {
          error: "validation.payments.method.required",
        }),
      }),
      z.object({
        method: z.enum(giftCardPaymentMethod, {
          error: "validation.payments.method.required",
        }),
        giftCardId: zObjectId("validation.payments.giftCardId.required"),
      }),
    ]),
  );

export type InStorePaymentUpdateModel = z.infer<
  typeof inStorePaymentUpdateModelSchema
>;

export type PaymentSummary = Prettify<
  Payment & {
    customerName?: string;
    serviceName?: string;
  }
>;

export type PaymentExportRow = Prettify<
  PaymentSummary & {
    customerEmail?: string;
    customerPhone?: string;
    appointmentDateTime?: Date;
    appointmentStatus?: string;
    appointmentTotalPrice?: number;
    addonNames?: string[];
  }
>;

export const PAYMENTS_EXPORT_MAX_ROWS = 10_000;
