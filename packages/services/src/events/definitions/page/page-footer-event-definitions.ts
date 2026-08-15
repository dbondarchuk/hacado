import { BaseAllKeys } from "@hacado/i18n";
import {
  PAGE_FOOTER_CREATED_EVENT_TYPE,
  PAGE_FOOTER_DELETED_EVENT_TYPE,
  PAGE_FOOTER_UPDATED_EVENT_TYPE,
  type EventDefinition,
  type PageFooterCreatedPayload,
  type PageFooterDeletedPayload,
  type PageFooterUpdatedPayload,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const PAGE_FOOTER_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [PAGE_FOOTER_CREATED_EVENT_TYPE]: {
    type: PAGE_FOOTER_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { pageFooter } = envelope.payload as PageFooterCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.pageFooter.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.pageFooter.created.description" satisfies BaseAllKeys,
          args: { name: pageFooter.name },
        },
        source: envelope.source,
        link: dashboardUrls.pageFooter(pageFooter._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [PAGE_FOOTER_UPDATED_EVENT_TYPE]: {
    type: PAGE_FOOTER_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { pageFooter } = envelope.payload as PageFooterUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.pageFooter.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.pageFooter.updated.description" satisfies BaseAllKeys,
          args: { name: pageFooter.name },
        },
        source: envelope.source,
        link: dashboardUrls.pageFooter(pageFooter._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [PAGE_FOOTER_DELETED_EVENT_TYPE]: {
    type: PAGE_FOOTER_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { pageFooterIds } = envelope.payload as PageFooterDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.pageFooter.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.pageFooter.deleted.description" satisfies BaseAllKeys,
          args: { count: pageFooterIds.length },
        },
        source: envelope.source,
        link: dashboardUrls.pageFooters,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
