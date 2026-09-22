import { PurchasedGiftCardListModel } from "./models/purchased-gift-card";

/**
 * Demo purchased gift card for template preview (e.g. email templates with gift card placeholders).
 * Used by getDemoEmailArguments when the gift-card-studio app implements demo-email-arguments-provider.
 */
const customerId = "customer-1234";

export const demoPurchasedGiftCard: Omit<
  PurchasedGiftCardListModel,
  "customer"
> = {
  _id: "purchased-gift-card-1234",
  appId: "gift-card-studio-app-1234",
  organizationId: "organization-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  designId: "design-1234",
  giftCardId: "gift-card-1234",
  amountPurchased: 100,
  customerId,
  toName: "Jane Doe",
  toEmail: "jane.doe@example.com",
  message: "Happy holidays!",
  cardGenerationStatus: "completed" as const,
  invoiceGenerationStatus: "completed" as const,
  recipientDeliveryStatus: "scheduled" as const,
  customerDeliveryStatus: "scheduled" as const,
  designName: "Demo gift card design",
  giftCardCode: "ABC-XYZ-123",
  status: "active",
  paymentId: "payment-1234",
  paymentMethod: "online",
  paymentStatus: "paid",
  paymentsCount: 1,
};
