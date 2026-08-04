import {
  teamRolePermissions,
  type RequiredPermission,
  type SessionUser,
  type TeamPermissionAction,
  type TeamPermissionResource,
  type TeamRolePermissions,
  type UserRole,
} from "@timelish/types";

function isUserRole(role: string | undefined | null): role is UserRole {
  return !!role && role in teamRolePermissions;
}

/** True if `user` grants `action` on `resource`. */
export function hasPermission<R extends TeamPermissionResource>(
  user: SessionUser | null | undefined,
  resource: R,
  action: TeamPermissionAction<R>,
): boolean {
  if (!user || !isUserRole(user.role)) return false;
  const rolePermissions = teamRolePermissions[user.role] as TeamRolePermissions;
  const granted = rolePermissions[resource] as
    | readonly TeamPermissionAction<R>[]
    | undefined;
  return !!granted?.includes(action);
}

/** True if `required` is omitted, or `user` has that permission. */
export function meetsRequiredPermission(
  user: SessionUser | null | undefined,
  required?: RequiredPermission,
): boolean {
  if (!required) return true;
  return hasPermission(
    user,
    required.resource,
    required.action as TeamPermissionAction<typeof required.resource>,
  );
}

export function canManageTeam(user: SessionUser | null | undefined): boolean {
  return hasPermission(user, "team", "invite");
}

/** Role rank for hierarchy checks (higher number = more privileged). */
export const USER_ROLE_RANK = {
  owner: 4,
  admin: 3,
  coordinator: 2,
  staff: 1,
} as const satisfies Record<UserRole, number>;

/** True when `actor` outranks `target` (same or higher is not allowed). */
export function isRoleStrictlyHigher(
  actor: UserRole | null | undefined,
  target: UserRole | null | undefined,
): boolean {
  if (!actor || !target) return false;
  if (!(actor in USER_ROLE_RANK) || !(target in USER_ROLE_RANK)) return false;
  return USER_ROLE_RANK[actor] > USER_ROLE_RANK[target];
}

/**
 * Whether the actor may edit another member's profile (`team:update` and
 * strictly higher role). Own profile is always edited via /users/me/profile.
 */
export function canUpdateTeamMemberProfile(
  actor: SessionUser | null | undefined,
  target: { memberId: string; role: UserRole } | null | undefined,
): boolean {
  if (!actor || !target) return false;
  if (actor.memberId === target.memberId) return false;
  if (!hasPermission(actor, "team", "update")) return false;
  return isRoleStrictlyHigher(actor.role, target.role);
}

/** Financial overview / payment KPIs — requires billing read. */
export function canViewFinancials(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "billing", "read");
}

/** View synced in-store payment review inbox. */
export function canReadSyncedPayments(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "syncedPayment", "read");
}

/** Confirm / assign / reject / ignore / edit synced payments. */
export function canManageSyncedPayments(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "syncedPayment", "manage");
}

/** Enter the financials section (overview and/or synced payment inbox). */
export function canAccessFinancialsSection(
  user: SessionUser | null | undefined,
): boolean {
  return canViewFinancials(user) || canReadSyncedPayments(user);
}

export function canUseScheduleApps(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "schedule", "update");
}

/**
 * Whether the user may edit calendar sources on their profile.
 * Coordinator+ have `schedule:manageCalendarSources`. Staff only when booking
 * config `allowStaffCalendarSources` is enabled.
 */
export function canManageCalendarSources(
  user: SessionUser | null | undefined,
  options?: { allowStaffCalendarSources?: boolean },
): boolean {
  if (hasPermission(user, "schedule", "manageCalendarSources")) {
    return true;
  }
  return user?.role === "staff" && !!options?.allowStaffCalendarSources;
}

/**
 * Whether busy-time lookups should use a member's personal calendar sources.
 * Non-staff always; staff only when booking config allows it.
 */
export function canUseMemberCalendarSources(
  role: UserRole | string | null | undefined,
  options?: { allowStaffCalendarSources?: boolean },
): boolean {
  if (!role) return false;
  if (role !== "staff") return true;
  return !!options?.allowStaffCalendarSources;
}

/** Filter appointments / waitlist by any team member (not only self). */
export function canFilterByMember(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "appointment", "readAll");
}

/**
 * Whether a member app may opt into processing other members' appointments
 * (`appointment:readAll` + `appointment:updateAll`, and multi-seat plan).
 */
export function canProcessOtherMembersAppointments(
  user: SessionUser | null | undefined,
): boolean {
  return (
    subscriptionAllowsMultipleUsers(user?.availableUsers) &&
    hasPermission(user, "appointment", "readAll") &&
    hasPermission(user, "appointment", "updateAll")
  );
}

/** True when the org subscription includes more than one user seat. */
export function subscriptionAllowsMultipleUsers(
  availableUsers: number | null | undefined,
): boolean {
  return (availableUsers ?? 1) > 1;
}

/** Role-only check for async event paths where a full SessionUser is unavailable. */
export function roleCanProcessOtherMembersAppointments(
  role: UserRole | string | null | undefined,
): boolean {
  if (!isUserRole(role)) return false;
  return (
    hasPermission({ role } as SessionUser, "appointment", "readAll") &&
    hasPermission({ role } as SessionUser, "appointment", "updateAll")
  );
}

/**
 * Clamp the stored config flag so only privileged actors can enable it.
 */
export function resolveProcessOtherMembersAppointmentsConfig(
  value: boolean | undefined,
  user: SessionUser | null | undefined,
): boolean {
  if (!canProcessOtherMembersAppointments(user)) return false;
  return !!value;
}

/** See every member's dashboard calendar / KPIs (`schedule:readAll`). */
export function canSeeAllCalendarMembers(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "schedule", "readAll");
}

/**
 * Calendar / dashboard member scope.
 * Without `schedule:readAll` → own member when no explicit request.
 * Explicit `requestedMemberId` is allowed when the user can see all schedules,
 * can read all appointments (appointment calendar), or it is their own member.
 */
export function resolveCalendarMemberId(
  user: SessionUser | null | undefined,
  requestedMemberId?: string | null,
): string | undefined {
  if (requestedMemberId) {
    if (
      canSeeAllCalendarMembers(user) ||
      canFilterByMember(user) ||
      requestedMemberId === user?.memberId
    ) {
      return requestedMemberId;
    }
    return user?.memberId || undefined;
  }
  if (!canSeeAllCalendarMembers(user)) {
    return user?.memberId || undefined;
  }
  return undefined;
}

/** Filter communication logs by any team member (not only self). */
export function canFilterCommunicationByMember(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "communication", "readAll");
}

/** Assign / reassign appointments to other team members. */
export function canReassignAppointment(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "appointment", "reassign");
}

/** Whether the user may update appointments at all (own and/or others). */
export function canUpdateAppointments(
  user: SessionUser | null | undefined,
): boolean {
  return hasPermission(user, "appointment", "update");
}

/**
 * Member scope for pending / actionable appointment lists.
 * `updateAll` → all members; otherwise only the current member.
 */
export function resolveUpdatableAppointmentMemberId(
  user: SessionUser | null | undefined,
): string | undefined {
  if (!canUpdateAppointments(user)) return user?.memberId || undefined;
  if (hasPermission(user, "appointment", "updateAll")) return undefined;
  return user?.memberId || undefined;
}

/**
 * Whether the user may mutate an appointment (edit / reschedule / status / note).
 * `updateAll` allows any member's appointment; otherwise only own `memberId`.
 */
export function canUpdateAppointment(
  user: SessionUser | null | undefined,
  appointmentMemberId: string | null | undefined,
): boolean {
  if (!hasPermission(user, "appointment", "update")) return false;
  if (hasPermission(user, "appointment", "updateAll")) return true;
  return !!user?.memberId && user.memberId === appointmentMemberId;
}
