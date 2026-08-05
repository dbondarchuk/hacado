import { OrganizationSubscriptionStatus } from "@hacado/types";

export function isSubscriptionActiveOrTrialing(
  status: string | undefined | null,
): boolean {
  return (
    status === OrganizationSubscriptionStatus.Active ||
    status === OrganizationSubscriptionStatus.Trialing
  );
}

export function isSubscriptionPastDue(
  status: string | undefined | null,
): boolean {
  return status === OrganizationSubscriptionStatus.PastDue;
}

export function isSubscriptionInactive(
  status: string | undefined | null,
): boolean {
  if (!status) return false;
  return !isSubscriptionActiveOrTrialing(status) && !isSubscriptionPastDue(status);
}
