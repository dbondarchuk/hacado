import { BaseAllKeys } from "@hacado/i18n";
import {
  CUSTOMER_CREATED_EVENT_TYPE,
  CUSTOMER_DELETED_EVENT_TYPE,
  CUSTOMER_UPDATED_EVENT_TYPE,
  type CustomerCreatedPayload,
  type CustomerDeletedPayload,
  type CustomerUpdatedPayload,
  type EventDefinition,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const CUSTOMER_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [CUSTOMER_CREATED_EVENT_TYPE]: {
    type: CUSTOMER_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { customer } = envelope.payload as CustomerCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.customer.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.customer.created.description" satisfies BaseAllKeys,
          args: { customerName: customer.name },
        },
        source: envelope.source,
        link: dashboardUrls.customer(customer._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [CUSTOMER_UPDATED_EVENT_TYPE]: {
    type: CUSTOMER_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { customer } = envelope.payload as CustomerUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.customer.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.customer.updated.description" satisfies BaseAllKeys,
          args: { customerName: customer.name },
        },
        source: envelope.source,
        link: dashboardUrls.customer(customer._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [CUSTOMER_DELETED_EVENT_TYPE]: {
    type: CUSTOMER_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { customers } = envelope.payload as CustomerDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.customer.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.customer.deleted.description" satisfies BaseAllKeys,
          args: {
            count: customers.length,
            names: customers.map((c) => c.name).join(", "),
          },
        },
        source: envelope.source,
        link: dashboardUrls.customers,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
