import type { Language } from "@hacado/i18n";
import type { Query, WithTotal } from "../database";
import type {
  MemberInactiveReason,
  MemberStatus,
  OrganizationMember,
  TeamMemberListModel,
  UserRole,
} from "../users";

/** Admin contact for org emails / built-in app ownership (from active members). */
export type OrganizationAdminContact = {
  memberId: string;
  email: string;
  name: string;
  language: Language;
};

export type DeactivateMemberResult =
  | { ok: true; upcomingAppointmentCount: number }
  | {
      ok: false;
      code:
        | "has_upcoming_appointments"
        | "not_found"
        | "cannot_deactivate_owner";
      upcomingAppointments?: Array<{
        _id: string;
        dateTime: Date;
        customerName?: string;
      }>;
    };

export type ReconcileSlotsResult = {
  deactivatedMemberIds: string[];
  reactivatedMemberIds: string[];
  availableUsers: number;
  activeMemberCount: number;
};

export type MemberProfileUpdate = Partial<
  Pick<
    OrganizationMember,
    | "name"
    | "phone"
    | "language"
    | "image"
    | "bio"
    | "calendarSources"
    | "meetingUrlProviderAppId"
  >
>;

export interface ITeamService {
  getMembers(options?: {
    status?: MemberStatus | MemberStatus[];
    includeInactive?: boolean;
  }): Promise<OrganizationMember[]>;

  listMembers(
    query: Query & {
      status?: MemberStatus[];
      role?: UserRole[];
      priorityIds?: string[];
      start?: Date;
      end?: Date;
    },
  ): Promise<WithTotal<TeamMemberListModel>>;

  getMemberById(memberId: string): Promise<OrganizationMember | null>;

  getMemberByUserId(userId: string): Promise<OrganizationMember | null>;

  getActiveMembers(): Promise<OrganizationMember[]>;

  getActiveMemberCount(): Promise<number>;

  getOwnerMember(): Promise<OrganizationMember>;

  canInviteMoreMembers(): Promise<boolean>;

  deactivateMember(
    memberId: string,
    reason: MemberInactiveReason,
    options?: { force?: boolean },
  ): Promise<DeactivateMemberResult>;

  reactivateMember(memberId: string): Promise<OrganizationMember | null>;

  updateMemberRole(
    memberId: string,
    role: Exclude<UserRole, "owner">,
  ): Promise<OrganizationMember | null>;

  /**
   * After availableUsers changes: deactivate excess (newest non-owners first)
   * or reactivate downgrade-inactive (oldest first).
   */
  reconcileMembersToSlots(): Promise<ReconcileSlotsResult>;

  listUpcomingAppointmentsForMember(memberId: string): Promise<
    Array<{
      _id: string;
      dateTime: Date;
      customerName?: string;
    }>
  >;

  hasUpcomingAppointmentsOnInactiveMembers(): Promise<
    Array<{
      memberId: string;
      memberName: string;
      count: number;
    }>
  >;

  /** Updates org-scoped profile fields for this member. */
  updateMemberProfile(
    memberId: string,
    profile: MemberProfileUpdate,
  ): Promise<OrganizationMember | null>;

  getOrganizationAdminContacts(): Promise<OrganizationAdminContact[]>;
}
