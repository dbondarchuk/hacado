import type { PaymentLinkPayment } from "@hacado/types/booking";

/**
 * Demo payment link for template preview (payment request email and SMS).
 * Used by getDemoEmailArguments when the app implements demo-arguments-provider.
 */
const customerId = "customer-1234";
const now = new Date(2024, 10, 20, 9, 0, 0);

export const demoPaymentLink: PaymentLinkPayment = {
  _id: "payment-link-1234",
  organizationId: "organization-1",
  amount: 75,
  status: "pending",
  customerId,
  description: "Balance due",
  type: "payment",
  method: "payment-link",
  appId: "payment-links-app-1234",
  appName: "payment-links",
  publicId: "demo-payment-link",
  sentToEmail: "john.smith@example.com",
  createdAt: now,
  updatedAt: now,
};
