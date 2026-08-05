import { BaseAllKeys } from "@hacado/i18n";
import {
  ADDON_CREATED_EVENT_TYPE,
  ADDON_DELETED_EVENT_TYPE,
  ADDON_UPDATED_EVENT_TYPE,
  type AddonCreatedPayload,
  type AddonDeletedPayload,
  type AddonUpdatedPayload,
  type EventDefinition,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const ADDON_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [ADDON_CREATED_EVENT_TYPE]: {
    type: ADDON_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { addon } = envelope.payload as AddonCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.addon.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.addon.created.description" satisfies BaseAllKeys,
          args: { name: addon.name },
        },
        source: envelope.source,
        link: dashboardUrls.addon(addon._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [ADDON_UPDATED_EVENT_TYPE]: {
    type: ADDON_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { addon } = envelope.payload as AddonUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.addon.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.addon.updated.description" satisfies BaseAllKeys,
          args: { name: addon.name },
        },
        source: envelope.source,
        link: dashboardUrls.addon(addon._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [ADDON_DELETED_EVENT_TYPE]: {
    type: ADDON_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { addonIds } = envelope.payload as AddonDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.addon.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.addon.deleted.description" satisfies BaseAllKeys,
          args: { count: addonIds.length },
        },
        source: envelope.source,
        link: dashboardUrls.addons,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
