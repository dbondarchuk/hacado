import { BaseAllKeys } from "@hacado/i18n";
import {
  SYNCED_PAYMENT_AMOUNTS_UPDATED_EVENT_TYPE,
  SYNCED_PAYMENT_ASSIGNED_EVENT_TYPE,
  SYNCED_PAYMENT_CONFIRMED_EVENT_TYPE,
  SYNCED_PAYMENT_IGNORED_EVENT_TYPE,
  SYNCED_PAYMENT_INGESTED_EVENT_TYPE,
  SYNCED_PAYMENT_REJECTED_EVENT_TYPE,
  SYNCED_PAYMENT_UNASSIGNED_EVENT_TYPE,
  SYNCED_PAYMENT_UNRECORDED_EVENT_TYPE,
  type EventDefinition,
  type SyncedPaymentAmountsUpdatedPayload,
  type SyncedPaymentAssignedPayload,
  type SyncedPaymentConfirmedPayload,
  type SyncedPaymentIgnoredPayload,
  type SyncedPaymentIngestedPayload,
  type SyncedPaymentRejectedPayload,
  type SyncedPaymentUnassignedPayload,
  type SyncedPaymentUnrecordedPayload,
} from "@hacado/types";

import { AvailableApps } from "@hacado/app-store";
import { dashboardUrls } from "../links";

export const SYNCED_PAYMENTS_REVIEW_BADGE_KEY = "synced_payments_review";

function syncedPaymentsReviewBadges(
  count: number,
): { key: string; count: number }[] {
  return [{ key: SYNCED_PAYMENTS_REVIEW_BADGE_KEY, count }];
}

async function reviewQueueBadges(services: {
  syncedPaymentsService: { getReviewQueueCount(): Promise<number> };
}) {
  const count = await services.syncedPaymentsService.getReviewQueueCount();
  return syncedPaymentsReviewBadges(count);
}

export const SYNCED_PAYMENT_EVENT_DEFINITIONS: Record<string, EventDefinition> =
  {
    [SYNCED_PAYMENT_INGESTED_EVENT_TYPE]: {
      type: SYNCED_PAYMENT_INGESTED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { syncedPayment } =
          envelope.payload as SyncedPaymentIngestedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "admin.platformEvents.syncedPayment.ingested.title" satisfies BaseAllKeys,
          },
          description: {
            key: "admin.platformEvents.syncedPayment.ingested.description" satisfies BaseAllKeys,
            args: {
              amount: syncedPayment.amount,
              provider: syncedPayment.appName,
              status: syncedPayment.status,
            },
          },
          source: envelope.source,
          link: dashboardUrls.syncedPayment(syncedPayment),
        };
      },
      dashboardNotification: async (envelope, services) => {
        const { syncedPayment } =
          envelope.payload as SyncedPaymentIngestedPayload;
        const badges = await reviewQueueBadges(services);
        const isMatched = syncedPayment.status === "matched";
        const keyPrefix = isMatched
          ? ("admin.syncedPayments.notifications.ingested.matched" as const)
          : ("admin.syncedPayments.notifications.ingested.unmatched" as const);

        return {
          type: "synced-payment-ingested",
          badges,
          toast: {
            type: isMatched ? "info" : "warning",
            title: {
              key: `${keyPrefix}.title` satisfies BaseAllKeys,
            },
            message: {
              key: `${keyPrefix}.message` satisfies BaseAllKeys,
              args: {
                amount: syncedPayment.amount,
                t_provider:
                  AvailableApps[syncedPayment.appName]?.displayName ??
                  syncedPayment.appName,
                t_status:
                  `admin.syncedPayments.status.${syncedPayment.status}` satisfies BaseAllKeys,
                dt_transactionTime: {
                  value: syncedPayment.transactionTime.toISOString(),
                  format: "DATETIME_HUGE",
                },
              },
            },
            action: {
              label: {
                key: `${keyPrefix}.action` satisfies BaseAllKeys,
              },
              href: dashboardUrls.syncedPayment(syncedPayment),
            },
          },
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    },
    [SYNCED_PAYMENT_CONFIRMED_EVENT_TYPE]: {
      type: SYNCED_PAYMENT_CONFIRMED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { syncedPayment } =
          envelope.payload as SyncedPaymentConfirmedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "admin.platformEvents.syncedPayment.confirmed.title" satisfies BaseAllKeys,
          },
          description: {
            key: "admin.platformEvents.syncedPayment.confirmed.description" satisfies BaseAllKeys,
            args: { amount: syncedPayment.amount },
          },
          source: envelope.source,
          link: dashboardUrls.syncedPayment(syncedPayment),
        };
      },
      dashboardNotification: async (_envelope, services) => ({
        type: "synced-payments-review",
        badges: await reviewQueueBadges(services),
      }),
      emailNotifications: false,
      smsNotifications: false,
    },
    [SYNCED_PAYMENT_REJECTED_EVENT_TYPE]: {
      type: SYNCED_PAYMENT_REJECTED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { syncedPayment } =
          envelope.payload as SyncedPaymentRejectedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "admin.platformEvents.syncedPayment.rejected.title" satisfies BaseAllKeys,
          },
          description: {
            key: "admin.platformEvents.syncedPayment.rejected.description" satisfies BaseAllKeys,
            args: { amount: syncedPayment.amount },
          },
          source: envelope.source,
          link: dashboardUrls.syncedPayments,
        };
      },
      dashboardNotification: async (_envelope, services) => ({
        type: "synced-payments-review",
        badges: await reviewQueueBadges(services),
      }),
      emailNotifications: false,
      smsNotifications: false,
    },
    [SYNCED_PAYMENT_ASSIGNED_EVENT_TYPE]: {
      type: SYNCED_PAYMENT_ASSIGNED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { syncedPayment, previousAppointmentId } =
          envelope.payload as SyncedPaymentAssignedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: (previousAppointmentId
              ? "admin.platformEvents.syncedPayment.reassigned.title"
              : "admin.platformEvents.syncedPayment.assigned.title") satisfies BaseAllKeys,
          },
          description: {
            key: (previousAppointmentId
              ? "admin.platformEvents.syncedPayment.reassigned.description"
              : "admin.platformEvents.syncedPayment.assigned.description") satisfies BaseAllKeys,
            args: {
              amount: syncedPayment.amount,
              appointmentId: syncedPayment.appointmentId,
            },
          },
          source: envelope.source,
          link: syncedPayment.appointmentId
            ? dashboardUrls.appointment(syncedPayment.appointmentId)
            : dashboardUrls.syncedPayment(syncedPayment),
        };
      },
      dashboardNotification: async (_envelope, services) => ({
        type: "synced-payments-review",
        badges: await reviewQueueBadges(services),
      }),
      emailNotifications: false,
      smsNotifications: false,
    },
    [SYNCED_PAYMENT_UNASSIGNED_EVENT_TYPE]: {
      type: SYNCED_PAYMENT_UNASSIGNED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { syncedPayment } =
          envelope.payload as SyncedPaymentUnassignedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "admin.platformEvents.syncedPayment.unassigned.title" satisfies BaseAllKeys,
          },
          description: {
            key: "admin.platformEvents.syncedPayment.unassigned.description" satisfies BaseAllKeys,
            args: { amount: syncedPayment.amount },
          },
          source: envelope.source,
          link: dashboardUrls.syncedPayment(syncedPayment),
        };
      },
      dashboardNotification: async (_envelope, services) => ({
        type: "synced-payments-review",
        badges: await reviewQueueBadges(services),
      }),
      emailNotifications: false,
      smsNotifications: false,
    },
    [SYNCED_PAYMENT_UNRECORDED_EVENT_TYPE]: {
      type: SYNCED_PAYMENT_UNRECORDED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { syncedPayment } =
          envelope.payload as SyncedPaymentUnrecordedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "admin.platformEvents.syncedPayment.unrecorded.title" satisfies BaseAllKeys,
          },
          description: {
            key: "admin.platformEvents.syncedPayment.unrecorded.description" satisfies BaseAllKeys,
            args: { amount: syncedPayment.amount },
          },
          source: envelope.source,
          link: dashboardUrls.syncedPayment(syncedPayment),
        };
      },
      dashboardNotification: async (_envelope, services) => ({
        type: "synced-payments-review",
        badges: await reviewQueueBadges(services),
      }),
      emailNotifications: false,
      smsNotifications: false,
    },
    [SYNCED_PAYMENT_IGNORED_EVENT_TYPE]: {
      type: SYNCED_PAYMENT_IGNORED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { syncedPayment } =
          envelope.payload as SyncedPaymentIgnoredPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "admin.platformEvents.syncedPayment.ignored.title" satisfies BaseAllKeys,
          },
          description: {
            key: "admin.platformEvents.syncedPayment.ignored.description" satisfies BaseAllKeys,
            args: { amount: syncedPayment.amount },
          },
          source: envelope.source,
          link: dashboardUrls.syncedPayments,
        };
      },
      dashboardNotification: async (_envelope, services) => ({
        type: "synced-payments-review",
        badges: await reviewQueueBadges(services),
      }),
      emailNotifications: false,
      smsNotifications: false,
    },
    [SYNCED_PAYMENT_AMOUNTS_UPDATED_EVENT_TYPE]: {
      type: SYNCED_PAYMENT_AMOUNTS_UPDATED_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { syncedPayment, previousPaymentAmount, previousTip } =
          envelope.payload as SyncedPaymentAmountsUpdatedPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "admin.platformEvents.syncedPayment.amountsUpdated.title" satisfies BaseAllKeys,
          },
          description: {
            key: "admin.platformEvents.syncedPayment.amountsUpdated.description" satisfies BaseAllKeys,
            args: {
              paymentAmount: syncedPayment.paymentAmount,
              tip: syncedPayment.inferredTip ?? 0,
              previousPaymentAmount,
              previousTip,
            },
          },
          source: envelope.source,
          link: syncedPayment.appointmentId
            ? dashboardUrls.appointment(syncedPayment.appointmentId)
            : dashboardUrls.syncedPayment(syncedPayment),
        };
      },
      dashboardNotification: false,
      emailNotifications: false,
      smsNotifications: false,
    },
  };
