import { BaseAllKeys } from "@hacado/i18n";
import type {
  EventDefinition,
  SettingsUpdatedPayload,
} from "@hacado/types/events";
import { SETTINGS_UPDATED_EVENT_TYPE } from "@hacado/types/events";

import { dashboardUrls } from "../links";

export const SETTINGS_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [SETTINGS_UPDATED_EVENT_TYPE]: {
    type: SETTINGS_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { key } = envelope.payload as SettingsUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.settings.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.settings.updated.description" satisfies BaseAllKeys,
          args: { key },
        },
        source: envelope.source,
        link: dashboardUrls.settings,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
