import { BaseAllKeys } from "@hacado/i18n";
import {
  PAGE_CREATED_EVENT_TYPE,
  PAGE_DELETED_EVENT_TYPE,
  PAGE_UPDATED_EVENT_TYPE,
  type EventDefinition,
  type PageCreatedPayload,
  type PageDeletedPayload,
  type PageUpdatedPayload,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const PAGE_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [PAGE_CREATED_EVENT_TYPE]: {
    type: PAGE_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { page } = envelope.payload as PageCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.page.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.page.created.description" satisfies BaseAllKeys,
          args: { title: page.title },
        },
        source: envelope.source,
        link: dashboardUrls.page(page._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [PAGE_UPDATED_EVENT_TYPE]: {
    type: PAGE_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { page } = envelope.payload as PageUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.page.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.page.updated.description" satisfies BaseAllKeys,
          args: { title: page.title },
        },
        source: envelope.source,
        link: dashboardUrls.page(page._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [PAGE_DELETED_EVENT_TYPE]: {
    type: PAGE_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { pageIds } = envelope.payload as PageDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.page.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.page.deleted.description" satisfies BaseAllKeys,
          args: { count: pageIds.length },
        },
        source: envelope.source,
        link: dashboardUrls.pages,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
