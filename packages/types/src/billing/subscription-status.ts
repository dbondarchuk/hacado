export const OrganizationSubscriptionStatus = {
  Incomplete: "incomplete",
  IncompleteExpired: "incomplete_expired",
  Trialing: "trialing",
  Active: "active",
  PastDue: "past_due",
  Canceled: "canceled",
  Unpaid: "unpaid",
} as const;

export type OrganizationSubscriptionStatus =
  (typeof OrganizationSubscriptionStatus)[keyof typeof OrganizationSubscriptionStatus];

const ORGANIZATION_SUBSCRIPTION_STATUS_VALUES = new Set<string>(
  Object.values(OrganizationSubscriptionStatus),
);

export function isOrganizationSubscriptionStatus(
  value: string,
): value is OrganizationSubscriptionStatus {
  return ORGANIZATION_SUBSCRIPTION_STATUS_VALUES.has(value);
}

export function parseOrganizationSubscriptionStatus(
  value: unknown,
): OrganizationSubscriptionStatus | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  return normalized as OrganizationSubscriptionStatus;
}
