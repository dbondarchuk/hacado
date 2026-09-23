import type { PaymentLinkPayment } from "@hacado/types";

/** Payment Links app domain events (emitted from app-store). */

export const PAYMENT_LINKS_PAYMENT_PAID_EVENT_TYPE =
  "payment-links.payment.paid" as const;

export type PaymentLinksPaymentPaidPayload = {
  appId: string;
  payment: PaymentLinkPayment;
};

export type PaymentLinksPaymentPaidEvent = {
  type: typeof PAYMENT_LINKS_PAYMENT_PAID_EVENT_TYPE;
  payload: PaymentLinksPaymentPaidPayload;
};
