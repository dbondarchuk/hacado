import { BaseAllKeys } from "@hacado/i18n";
import {
  TEMPLATE_CREATED_EVENT_TYPE,
  TEMPLATE_DELETED_EVENT_TYPE,
  TEMPLATE_UPDATED_EVENT_TYPE,
  type EventDefinition,
  type TemplateCreatedPayload,
  type TemplateDeletedPayload,
  type TemplateUpdatedPayload,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const TEMPLATE_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [TEMPLATE_CREATED_EVENT_TYPE]: {
    type: TEMPLATE_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { template } = envelope.payload as TemplateCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.template.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.template.created.description" satisfies BaseAllKeys,
          args: { name: template.name },
        },
        source: envelope.source,
        link: dashboardUrls.template(template._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [TEMPLATE_UPDATED_EVENT_TYPE]: {
    type: TEMPLATE_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { template } = envelope.payload as TemplateUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.template.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.template.updated.description" satisfies BaseAllKeys,
          args: { name: template.name },
        },
        source: envelope.source,
        link: dashboardUrls.template(template._id),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [TEMPLATE_DELETED_EVENT_TYPE]: {
    type: TEMPLATE_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { templateIds } = envelope.payload as TemplateDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.template.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.template.deleted.description" satisfies BaseAllKeys,
          args: { count: templateIds.length },
        },
        source: envelope.source,
        link: dashboardUrls.templates,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
