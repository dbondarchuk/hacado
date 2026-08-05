import type { Language } from "@hacado/i18n";
import type { CalendarSourcesConfiguration } from "../configuration/booking/calendar-source";
import type { UserRole } from "./user";

export const MEMBER_STATUSES = ["active", "inactive"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_INACTIVE_REASONS = ["downgrade", "removed"] as const;
export type MemberInactiveReason = (typeof MEMBER_INACTIVE_REASONS)[number];

/**
 * Canonical organization membership record (Better Auth `members` collection).
 * `_id` is the `memberId` referenced by appointments, services, apps, etc.
 * Profile fields are org-scoped (a user may belong to multiple orgs later).
 */
export type OrganizationMember = {
  _id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  createdAt: Date;
  status: MemberStatus;
  inactiveReason?: MemberInactiveReason;
  inactivatedAt?: Date;
  /** Auth email denormalized for queries/joins (kept in sync on email change). */
  email: string;
  /** Org-scoped display name. */
  name: string;
  phone: string;
  bio?: string | null;
  language: Language;
  image?: string | null;
  calendarSources?: CalendarSourcesConfiguration;
  /** Connected app used to create online meeting URLs (one per member). */
  meetingUrlProviderAppId?: string | null;
};
