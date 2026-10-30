"use client";

import type { SubscriptionFeature } from "@hacado/types/billing";
import type {
  RequiredPermission,
  SessionUser,
  TeamPermissionAction,
  TeamPermissionResource,
  UserRole,
} from "@hacado/types/users";
import {
  canAccessFinancialsSection,
  canFilterByMember,
  canFilterCommunicationByMember,
  canManageCalendarSources,
  canManageSyncedPayments,
  canManageTeam,
  canProcessOtherMembersAppointments,
  canReadActivity,
  canReadSyncedPayments,
  canReassignAppointment,
  canSeeAllCalendarMembers,
  canUpdateAppointment,
  canUpdateAppointments,
  canUpdateTeamMemberProfile,
  canUseFeature,
  canUseScheduleApps,
  canViewFinancials,
  hasPermission,
  meetsRequiredPermission,
  resolveCalendarMemberId,
  resolveProcessOtherMembersAppointmentsConfig,
  resolveUpdatableAppointmentMemberId,
} from "@hacado/utils";
import { createContext, useContext } from "react";

export type AuthContextProps = {
  user: SessionUser;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextProps>(
  {} as AuthContextProps,
);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const useCanAccessFeature = (feature: SubscriptionFeature) => {
  const { user } = useAuth();
  return canUseFeature(user?.subscriptionPlanTier ?? null, feature);
};

export const useHasPermission = <R extends TeamPermissionResource>(
  resource: R,
  action: TeamPermissionAction<R>,
) => {
  const { user } = useAuth();
  return hasPermission(user, resource, action);
};

export const useMeetsRequiredPermission = (required?: RequiredPermission) => {
  const { user } = useAuth();
  return meetsRequiredPermission(user, required);
};

export const useCanManageTeam = () => {
  const { user } = useAuth();
  return canManageTeam(user);
};

export const useCanUpdateTeamMemberProfile = (
  target: { memberId: string; role: UserRole } | null | undefined,
) => {
  const { user } = useAuth();
  return canUpdateTeamMemberProfile(user, target);
};

export const useCanReadActivity = () => {
  const { user } = useAuth();
  return canReadActivity(user);
};

export const useCanViewFinancials = () => {
  const { user } = useAuth();
  return canViewFinancials(user);
};

export const useCanReadSyncedPayments = () => {
  const { user } = useAuth();
  return canReadSyncedPayments(user);
};

export const useCanManageSyncedPayments = () => {
  const { user } = useAuth();
  return canManageSyncedPayments(user);
};

export const useCanAccessFinancialsSection = () => {
  const { user } = useAuth();
  return canAccessFinancialsSection(user);
};

export const useCanUseScheduleApps = () => {
  const { user } = useAuth();
  return canUseScheduleApps(user);
};

export const useCanManageCalendarSources = (options?: {
  allowStaffCalendarSources?: boolean;
}) => {
  const { user } = useAuth();
  return canManageCalendarSources(user, options);
};

export const useCanFilterByMember = () => {
  const { user } = useAuth();
  return canFilterByMember(user);
};

export const useCanProcessOtherMembersAppointments = () => {
  const { user } = useAuth();
  return canProcessOtherMembersAppointments(user);
};

export const useResolveProcessOtherMembersAppointmentsConfig = (
  value: boolean | undefined,
) => {
  const { user } = useAuth();
  return resolveProcessOtherMembersAppointmentsConfig(value, user);
};

export const useCanSeeAllCalendarMembers = () => {
  const { user } = useAuth();
  return canSeeAllCalendarMembers(user);
};

export const useResolveCalendarMemberId = (
  requestedMemberId?: string | null,
) => {
  const { user } = useAuth();
  return resolveCalendarMemberId(user, requestedMemberId);
};

export const useCanFilterCommunicationByMember = () => {
  const { user } = useAuth();
  return canFilterCommunicationByMember(user);
};

export const useCanReassignAppointment = () => {
  const { user } = useAuth();
  return canReassignAppointment(user);
};

export const useCanUpdateAppointments = () => {
  const { user } = useAuth();
  return canUpdateAppointments(user);
};

export const useResolveUpdatableAppointmentMemberId = () => {
  const { user } = useAuth();
  return resolveUpdatableAppointmentMemberId(user);
};

export const useCanUpdateAppointment = (
  appointmentMemberId: string | null | undefined,
) => {
  const { user } = useAuth();
  return canUpdateAppointment(user, appointmentMemberId);
};
