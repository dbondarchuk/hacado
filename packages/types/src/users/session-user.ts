import type { Language } from "@hacado/i18n";
import type { BillingPlanTier } from "../billing/subscription-plan";
import type { OrganizationSubscriptionStatus } from "../billing/subscription-status";
import type { CalendarSourceConfiguration } from "../configuration/booking/calendar-source";
import type { MemberStatus } from "./member";
import type { UserRole } from "./user";

/**
 * Better Auth custom session `user` shape (admin `customSession`).
 * Passed into connected-app `processRequest` / `processStaticRequest` /
 * `processFormRequest` so apps have full actor + org context, not only `memberId`.
 */
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  phone: string;
  bio: string | null;
  language: Language;
  organizationInstalled: boolean;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationDomain: string;
  role: UserRole;
  memberId: string;
  memberStatus: MemberStatus;
  memberRole: UserRole;
  availableUsers: number;
  allowAdditionalUsers: boolean;
  subscriptionStatus: OrganizationSubscriptionStatus;
  subscriptionPlanTier: BillingPlanTier | null;
  feesExempt: boolean;
  calendarSources: CalendarSourceConfiguration[];
  meetingUrlProviderAppId?: string | null;
};
