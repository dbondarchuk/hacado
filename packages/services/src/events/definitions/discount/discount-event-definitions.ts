import { BaseAllKeys } from "@hacado/i18n";
import {
  DISCOUNT_APPLIED_EVENT_TYPE,
  DISCOUNT_CREATED_EVENT_TYPE,
  DISCOUNT_DELETED_EVENT_TYPE,
  DISCOUNT_UPDATED_EVENT_TYPE,
  type DiscountAppliedPayload,
  type DiscountCreatedPayload,
  type DiscountDeletedPayload,
  type DiscountUpdatedPayload,
  type EventDefinition,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const DISCOUNT_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [DISCOUNT_CREATED_EVENT_TYPE]: {
    type: DISCOUNT_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { discount } = envelope.payload as DiscountCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.discount.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.discount.created.description" satisfies BaseAllKeys,
          args: { name: discount.name },
        },
        source: envelope.source,
        link: dashboardUrls.discount(discount._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [DISCOUNT_UPDATED_EVENT_TYPE]: {
    type: DISCOUNT_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { discount } = envelope.payload as DiscountUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.discount.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.discount.updated.description" satisfies BaseAllKeys,
          args: { name: discount.name },
        },
        source: envelope.source,
        link: dashboardUrls.discount(discount._id.toString()),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [DISCOUNT_DELETED_EVENT_TYPE]: {
    type: DISCOUNT_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { discountIds } = envelope.payload as DiscountDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.discount.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.discount.deleted.description" satisfies BaseAllKeys,
          args: { count: discountIds.length },
        },
        source: envelope.source,
        link: dashboardUrls.discounts,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [DISCOUNT_APPLIED_EVENT_TYPE]: {
    type: DISCOUNT_APPLIED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { customer, discount } = envelope.payload as DiscountAppliedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.discount.applied.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.discount.applied.description" satisfies BaseAllKeys,
          args: {
            customerName: customer.name,
            discountName: discount.name,
            value: discount.value,
          },
        },
        source: envelope.source,
        link: dashboardUrls.appointment(discount.appointmentId),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
