import { BaseAllKeys } from "@hacado/i18n";
import {
  FIELD_CREATED_EVENT_TYPE,
  FIELD_DELETED_EVENT_TYPE,
  FIELD_UPDATED_EVENT_TYPE,
  type EventDefinition,
  type FieldCreatedPayload,
  type FieldDeletedPayload,
  type FieldUpdatedPayload,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const FIELD_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [FIELD_CREATED_EVENT_TYPE]: {
    type: FIELD_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { field } = envelope.payload as FieldCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.field.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.field.created.description" satisfies BaseAllKeys,
          args: { name: field.name },
        },
        source: envelope.source,
        link: dashboardUrls.field(field._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [FIELD_UPDATED_EVENT_TYPE]: {
    type: FIELD_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { field } = envelope.payload as FieldUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.field.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.field.updated.description" satisfies BaseAllKeys,
          args: { name: field.name },
        },
        source: envelope.source,
        link: dashboardUrls.field(field._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [FIELD_DELETED_EVENT_TYPE]: {
    type: FIELD_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { fieldIds } = envelope.payload as FieldDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.field.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.field.deleted.description" satisfies BaseAllKeys,
          args: { count: fieldIds.length },
        },
        source: envelope.source,
        link: dashboardUrls.fields,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
