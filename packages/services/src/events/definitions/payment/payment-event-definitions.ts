import { BaseAllKeys } from "@hacado/i18n";
import {
  PAYMENT_CREATED_EVENT_TYPE,
  PAYMENT_DELETED_EVENT_TYPE,
  PAYMENT_REFUNDED_EVENT_TYPE,
  PAYMENT_UPDATED_EVENT_TYPE,
  type EventDefinition,
  type PaymentCreatedPayload,
  type PaymentDeletedPayload,
  type PaymentRefundedPayload,
  type PaymentUpdatedPayload,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const PAYMENT_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [PAYMENT_CREATED_EVENT_TYPE]: {
    type: PAYMENT_CREATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { payment } = envelope.payload as PaymentCreatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.payment.created.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.payment.created.description" satisfies BaseAllKeys,
          args: {
            amount: payment.amount,
            type: payment.type,
          },
        },
        source: envelope.source,
        link: dashboardUrls.payment(payment),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [PAYMENT_UPDATED_EVENT_TYPE]: {
    type: PAYMENT_UPDATED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { payment } = envelope.payload as PaymentUpdatedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.payment.updated.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.payment.updated.description" satisfies BaseAllKeys,
          args: {
            amount: payment.amount,
            status: payment.status,
          },
        },
        source: envelope.source,
        link: dashboardUrls.payment(payment),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [PAYMENT_DELETED_EVENT_TYPE]: {
    type: PAYMENT_DELETED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { payment } = envelope.payload as PaymentDeletedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.payment.deleted.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.payment.deleted.description" satisfies BaseAllKeys,
          args: { amount: payment.amount },
        },
        source: envelope.source,
        link: dashboardUrls.payment(payment),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [PAYMENT_REFUNDED_EVENT_TYPE]: {
    type: PAYMENT_REFUNDED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { payment, amount } = envelope.payload as PaymentRefundedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.payment.refunded.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.payment.refunded.description" satisfies BaseAllKeys,
          args: { refundAmount: amount, amount: payment.amount },
        },
        source: envelope.source,
        link: dashboardUrls.payment(payment),
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
