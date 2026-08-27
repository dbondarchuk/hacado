import { BaseAllKeys } from "@hacado/i18n";
import {
  MEMBER_CREATED_EVENT_TYPE,
  MEMBER_DEACTIVATED_EVENT_TYPE,
  MEMBER_PROFILE_UPDATED_EVENT_TYPE,
  MEMBER_REACTIVATED_EVENT_TYPE,
  MEMBER_ROLE_CHANGED_EVENT_TYPE,
  type EventDefinition,
  type MemberCreatedPayload,
  type MemberDeactivatedPayload,
  type MemberProfileUpdatedPayload,
  type MemberReactivatedPayload,
  type MemberRoleChangedPayload,
} from "@hacado/types";

import { dashboardUrls } from "../links";

function memberDisplayName(member: {
  name?: string;
  email?: string;
  userId: string;
}): string {
  return member.name || member.email || member.userId;
}

export const MEMBER_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [MEMBER_CREATED_EVENT_TYPE]: {
    type: MEMBER_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { member } = envelope.payload as MemberCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.member.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.member.created.description" satisfies BaseAllKeys,
          args: {
            memberName: memberDisplayName(member),
            role: member.role,
          },
        },
        source: envelope.source,
        noExpiry: true,
        link: dashboardUrls.teamMember(member._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [MEMBER_DEACTIVATED_EVENT_TYPE]: {
    type: MEMBER_DEACTIVATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { member, reason } = envelope.payload as MemberDeactivatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.member.deactivated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.member.deactivated.description" satisfies BaseAllKeys,
          args: {
            memberName: memberDisplayName(member),
            reason,
          },
        },
        source: envelope.source,
        noExpiry: true,
        link: dashboardUrls.teamMember(member._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [MEMBER_REACTIVATED_EVENT_TYPE]: {
    type: MEMBER_REACTIVATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { member } = envelope.payload as MemberReactivatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.member.reactivated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.member.reactivated.description" satisfies BaseAllKeys,
          args: { memberName: memberDisplayName(member) },
        },
        source: envelope.source,
        noExpiry: true,
        link: dashboardUrls.teamMember(member._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [MEMBER_ROLE_CHANGED_EVENT_TYPE]: {
    type: MEMBER_ROLE_CHANGED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { member, previousRole, role } =
        envelope.payload as MemberRoleChangedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.member.roleChanged.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.member.roleChanged.description" satisfies BaseAllKeys,
          args: {
            memberName: memberDisplayName(member),
            previousRole,
            role,
          },
        },
        source: envelope.source,
        noExpiry: true,
        link: dashboardUrls.teamMember(member._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [MEMBER_PROFILE_UPDATED_EVENT_TYPE]: {
    type: MEMBER_PROFILE_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { member } = envelope.payload as MemberProfileUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.member.profileUpdated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.member.profileUpdated.description" satisfies BaseAllKeys,
          args: { memberName: memberDisplayName(member) },
        },
        source: envelope.source,
        link: dashboardUrls.teamMember(member._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
