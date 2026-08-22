import type { CustomerPackage } from "@hacado/types";

/**
 * Demo customer package for template preview (e.g. package lifecycle emails).
 * Used by getDemoEmailArguments when the app implements demo-arguments-provider.
 */
const customerId = "customer-1234";
const itemId = "package-item-1";
const now = new Date(2024, 10, 20, 9, 0, 0);

export const demoCustomerPackage: CustomerPackage = {
  _id: "customer-package-1234",
  organizationId: "organization-1",
  customerId,
  packageId: "package-1234",
  name: "10x Massage",
  description: "Ten massage sessions prepaid",
  price: 200,
  items: [
    {
      _id: itemId,
      optionId: "dfjkdlfj",
      credits: 10,
      creditsPerRedemption: 1,
      optionName: "Demo option",
    },
  ],
  purchasedAt: now,
  expiresAt: new Date(2025, 10, 20, 9, 0, 0),
  status: "active",
  channel: "customer",
  remainingByItem: { [itemId]: 7 },
  totalCredits: 10,
  remainingCredits: 7,
  createdAt: now,
  updatedAt: now,
};

export const demoPackageEmailArguments = {
  package: {
    ...demoCustomerPackage,
    isPurchased: true,
    isExhausted: false,
    isCancelled: false,
    isExpired: false,
    isExpiringSoon: true,
  },
};
