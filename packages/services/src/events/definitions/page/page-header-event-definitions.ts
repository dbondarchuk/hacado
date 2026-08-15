import { BaseAllKeys } from "@hacado/i18n";
import {
  PAGE_HEADER_CREATED_EVENT_TYPE,
  PAGE_HEADER_DELETED_EVENT_TYPE,
  PAGE_HEADER_UPDATED_EVENT_TYPE,
  type EventDefinition,
  type PageHeaderCreatedPayload,
  type PageHeaderDeletedPayload,
  type PageHeaderUpdatedPayload,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const PAGE_HEADER_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [PAGE_HEADER_CREATED_EVENT_TYPE]: {
    type: PAGE_HEADER_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { pageHeader } = envelope.payload as PageHeaderCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.pageHeader.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.pageHeader.created.description" satisfies BaseAllKeys,
          args: { name: pageHeader.name },
        },
        source: envelope.source,
        link: dashboardUrls.pageHeader(pageHeader._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [PAGE_HEADER_UPDATED_EVENT_TYPE]: {
    type: PAGE_HEADER_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { pageHeader } = envelope.payload as PageHeaderUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.pageHeader.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.pageHeader.updated.description" satisfies BaseAllKeys,
          args: { name: pageHeader.name },
        },
        source: envelope.source,
        link: dashboardUrls.pageHeader(pageHeader._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [PAGE_HEADER_DELETED_EVENT_TYPE]: {
    type: PAGE_HEADER_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { pageHeaderIds } = envelope.payload as PageHeaderDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.pageHeader.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.pageHeader.deleted.description" satisfies BaseAllKeys,
          args: { count: pageHeaderIds.length },
        },
        source: envelope.source,
        link: dashboardUrls.pageHeaders,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
