import { OrganizationSubscriptionStatus } from "../billing";
import { WithDatabaseId } from "../database";

/** Remaining SMS credits: subscription-included pool vs one-time top-ups (consumption order: included first). */
export type OrganizationSmsBalance = {
  included: number;
  topup: number;
};

/** Seat pools: plan-included vs recurring additional-user Polar products. */
export type OrganizationUserSlots = {
  included: number;
  additional: number;
};

export type OrganizationUserSlotGrant = {
  polarSubscriptionId: string;
  usersAmount: number;
  source: "plan" | "addon";
};

export type Organization = WithDatabaseId<{
  slug: string;
  name?: string;
  domain?: string | null;
  isInstalled?: boolean;
  /** When true, the org skips Polar billing and has no member/seat cap. */
  feesExempt?: boolean;
  /** Polar subscription id (org-level billing via checkout metadata.referenceId). */
  polarSubscriptionId?: string;
  polarSubscriptionStatus?: OrganizationSubscriptionStatus;
  polarSubscriptionProductId?: string;
  smsBalance?: OrganizationSmsBalance;
  /** Seat pools kept in sync with Polar (mirrors smsBalance). */
  userSlots?: OrganizationUserSlots;
  /** Denormalized: userSlots.included + userSlots.additional. */
  availableUsers?: number;
  /** Active Polar seat grants for accurate revoke on cancel. */
  userSlotGrants?: OrganizationUserSlotGrant[];
  /** Whether the current plan allows purchasing additional seat products. */
  allowAdditionalUsers?: boolean;
  /**
   * Cached Polar product metadata `activity_retention_days`.
   * `null` means unlimited; omit the field when it has not been resolved yet.
   */
  activityRetentionDays?: number | null;
}>;
