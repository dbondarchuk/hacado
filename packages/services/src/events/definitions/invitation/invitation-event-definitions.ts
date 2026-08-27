import { BaseAllKeys } from "@hacado/i18n";
import {
  INVITATION_CANCELED_EVENT_TYPE,
  INVITATION_CREATED_EVENT_TYPE,
  type EventDefinition,
  type InvitationCanceledPayload,
  type InvitationCreatedPayload,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const INVITATION_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [INVITATION_CREATED_EVENT_TYPE]: {
    type: INVITATION_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { email, role } = envelope.payload as InvitationCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.invitation.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.invitation.created.description" satisfies BaseAllKeys,
          args: { email, role },
        },
        source: envelope.source,
        noExpiry: true,
        link: dashboardUrls.team,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [INVITATION_CANCELED_EVENT_TYPE]: {
    type: INVITATION_CANCELED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { email, role } = envelope.payload as InvitationCanceledPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.invitation.canceled.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.invitation.canceled.description" satisfies BaseAllKeys,
          args: { email, role },
        },
        source: envelope.source,
        noExpiry: true,
        link: dashboardUrls.team,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
