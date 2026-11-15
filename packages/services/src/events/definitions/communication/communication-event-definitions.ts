import type { BaseAllKeys } from "@hacado/i18n/keys";
import type { NotificationAudience } from "@hacado/types/apps";
import type {
  CommunicationFailedPayload,
  EventDefinition,
} from "@hacado/types/events";
import { COMMUNICATION_FAILED_EVENT_TYPE } from "@hacado/types/events";
import type { IServicesContainer } from "@hacado/types/services";

import { dashboardUrls } from "../links";

async function communicationFailedAudience(
  payload: CommunicationFailedPayload,
  services: IServicesContainer,
): Promise<NotificationAudience | null> {
  if (payload.memberId) {
    return { appointmentMemberId: payload.memberId };
  }

  const admins = await services.teamService.getOrganizationAdminContacts();
  if (!admins.length) {
    return null;
  }

  return { memberIds: admins.map((admin) => admin.memberId) };
}

function communicationFailedToast(payload: CommunicationFailedPayload) {
  const href = dashboardUrls.communicationLog(payload.logId);

  return {
    type: "error" as const,
    title: {
      key: "admin.communications.notifications.failed.title" satisfies BaseAllKeys,
    },
    message: {
      key: "admin.communications.notifications.failed.message" satisfies BaseAllKeys,
      args: {
        t_channel:
          `admin.common.labels.channel.${payload.channel}` satisfies BaseAllKeys,
        participant: payload.participant,
      },
    },
    action: {
      label: {
        key: "admin.communications.notifications.failed.action" satisfies BaseAllKeys,
      },
      href,
    },
  };
}

export const COMMUNICATION_EVENT_DEFINITIONS: Record<string, EventDefinition> =
  {
    [COMMUNICATION_FAILED_EVENT_TYPE]: {
      type: COMMUNICATION_FAILED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const payload = envelope.payload as CommunicationFailedPayload;

        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "admin.platformEvents.communication.failed.title" satisfies BaseAllKeys,
          },
          description: {
            key: "admin.platformEvents.communication.failed.description" satisfies BaseAllKeys,
            args: {
              t_channel:
                `admin.common.labels.channel.${payload.channel}` satisfies BaseAllKeys,
              participant: payload.participant,
            },
          },
          source: envelope.source,
          severity: "error",
          link: dashboardUrls.communicationLog(payload.logId),
        };
      },
      dashboardNotification: async (envelope, services) => {
        const payload = envelope.payload as CommunicationFailedPayload;
        const audience = await communicationFailedAudience(payload, services);

        if (!audience) {
          return null;
        }

        return {
          type: "communication-failed",
          toast: communicationFailedToast(payload),
          audience,
        };
      },
      pushNotification: async (envelope, services) => {
        const payload = envelope.payload as CommunicationFailedPayload;
        const audience = await communicationFailedAudience(payload, services);

        if (!audience) {
          return null;
        }

        const toast = communicationFailedToast(payload);

        return {
          title: toast.title,
          body: toast.message,
          url: toast.action.href,
          tag: COMMUNICATION_FAILED_EVENT_TYPE,
          audience,
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    },
  };
