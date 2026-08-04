import type { Language } from "@timelish/i18n";

/** Org-scoped roles. Canonical source is Better Auth `members.role`. */
export const USER_ROLES = ["owner", "admin", "coordinator", "staff"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Signup staging until an organization member row is created.
 * Cleared after create-org / accept-invitation succeeds.
 */
export type PendingMemberProfile = {
  name?: string;
  phone?: string;
  language?: Language;
};

/**
 * Auth-identity user document. Organization membership and per-org profile
 * live on `members` (`OrganizationMember`).
 */
export type User = {
  _id: string;
  email: string;
  /** Better Auth account display name (not the org profile source of truth). */
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  emailVerified?: boolean;
  pendingMemberProfile?: PendingMemberProfile | null;
};
