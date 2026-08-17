import type { Organization } from "@hacado/types";

export type OrganizationSeatFields = Pick<
  Organization,
  "feesExempt" | "availableUsers" | "userSlots"
>;

/** Better Auth `membershipLimit` requires a finite number; fees-exempt orgs have no cap. */
export const UNLIMITED_MEMBERSHIP_LIMIT = Number.MAX_SAFE_INTEGER;

/** Fees-exempt orgs are unlimited - Polar seat ledgers do not apply. */
export function hasUnlimitedUserSlots(
  org: Pick<Organization, "feesExempt"> | null | undefined,
): boolean {
  return org?.feesExempt === true;
}

/**
 * Polar seat capacity. `null` means unlimited (fees-exempt).
 */
export function resolveAvailableUsers(
  org: OrganizationSeatFields | null | undefined,
): number | null {
  if (hasUnlimitedUserSlots(org)) return null;
  return (
    org?.availableUsers ??
    (org?.userSlots
      ? (org.userSlots.included ?? 0) + (org.userSlots.additional ?? 0)
      : 1)
  );
}

export function canInviteWithAvailableUsers(
  activeCount: number,
  availableUsers: number | null,
): boolean {
  if (availableUsers === null) return true;
  return activeCount < availableUsers;
}

export function membershipLimitFromAvailableUsers(
  availableUsers: number | null,
): number {
  return availableUsers ?? UNLIMITED_MEMBERSHIP_LIMIT;
}
