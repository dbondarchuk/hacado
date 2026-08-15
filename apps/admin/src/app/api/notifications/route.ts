import {
  getOrganizationId,
  getServicesContainer,
  getSession,
} from "@/app/utils";
import { BaseAllKeys } from "@hacado/i18n";
import { getLoggerFactory } from "@hacado/logger";
import { getDashboardNotificationRealtimeBroker } from "@hacado/services";
import {
  DashboardNotification,
  IDashboardNotifierApp,
  type SessionUser,
} from "@hacado/types";
import {
  canReadActivity,
  canReadSyncedPayments,
  canUpdateAppointments,
  resolveUpdatableAppointmentMemberId,
} from "@hacado/utils";
import { DateTime } from "luxon";
import { NextRequest } from "next/server";
import { v4 } from "uuid";

const getActivityFeedNotifications = async (memberId: string) => {
  const servicesContainer = await getServicesContainer();

  const [preview, highestSeverity] = await Promise.all([
    servicesContainer.activityService.getActivityPreview(3),
    servicesContainer.activityService.getHighestSeveritySinceLastRead(memberId),
  ]);

  return {
    type: "activity-feed",
    activityFeed: { preview, highestSeverity },
  } satisfies DashboardNotification;
};

const getPendingAppointmentsNotifications = async (
  user: SessionUser,
  date?: Date,
) => {
  if (!canUpdateAppointments(user)) {
    return {
      type: "pending-appointments",
      badges: [
        {
          key: "pending_appointments",
          count: 0,
        },
      ],
    } satisfies DashboardNotification;
  }

  const servicesContainer = await getServicesContainer();
  const memberId = resolveUpdatableAppointmentMemberId(user);
  const { totalCount, newCount } =
    await servicesContainer.bookingService.getPendingAppointmentsCount(
      new Date(),
      date,
      memberId,
    );

  return {
    type: "pending-appointments",
    badges: [
      {
        key: "pending_appointments",
        count: totalCount,
      },
    ],
    toast:
      newCount > 0
        ? {
            type: "info",
            title: {
              key: "admin.dashboard.appointments.pendingToast" satisfies BaseAllKeys,
              args: {
                count: newCount,
              },
            },
            message: {
              key: "admin.dashboard.appointments.pendingToastMessage" satisfies BaseAllKeys,
              args: {
                count: newCount,
              },
            },
            action: {
              label: {
                key: "admin.dashboard.appointments.view" satisfies BaseAllKeys,
              },
              href: `/dashboard?activeTab=appointments&key=${Date.now()}`,
            },
          }
        : undefined,
  } satisfies DashboardNotification;
};

const getSyncedPaymentsReviewNotifications = async () => {
  const servicesContainer = await getServicesContainer();
  const count =
    await servicesContainer.syncedPaymentsService.getReviewQueueCount();

  return {
    type: "synced-payments-review",
    badges: [
      {
        key: "synced_payments_review",
        count,
      },
    ],
  } satisfies DashboardNotification;
};

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/notifications")("GET");
  const servicesContainer = await getServicesContainer();
  const organizationId = await getOrganizationId();

  const session = await getSession();
  const memberId = session.user.memberId;

  logger.debug("Starting notifications SSE stream");

  const encoder = new TextEncoder();

  let lastDate: Date | undefined = undefined;
  const paramsDateStr = request.nextUrl.searchParams.get("date");
  if (paramsDateStr) {
    const paramsDate = DateTime.fromISO(paramsDateStr);
    if (paramsDate.isValid) {
      lastDate = paramsDate.toJSDate();
    }
  }

  const fn = async (
    callback: (notifications: DashboardNotification[]) => void,
  ) => {
    logger.debug("Getting pending appointments notifications");
    const count = await getPendingAppointmentsNotifications(
      session.user,
      lastDate,
    );
    const syncedPaymentsReview = canReadSyncedPayments(session.user)
      ? await getSyncedPaymentsReviewNotifications()
      : undefined;
    const activityFeed = canReadActivity(session.user)
      ? await getActivityFeedNotifications(memberId)
      : undefined;

    let notifications: DashboardNotification[] = [
      count,
      ...(syncedPaymentsReview ? [syncedPaymentsReview] : []),
      ...(activityFeed ? [activityFeed] : []),
    ];

    logger.debug("Invoking dashboard notifier apps");
    const results =
      await servicesContainer.connectedAppsService.invokeAppsByScope<
        IDashboardNotifierApp,
        DashboardNotification[]
      >(
        "dashboard-notifier",
        async (app, service) => {
          return await service.getInitialNotifications(app, memberId, lastDate);
        },
        {
          concurrencyLimit: 10,
          ignoreErrors: true,
        },
      );

    const filteredResults = results
      .filter(Boolean)
      .flat()
      .filter((n) => !!n);
    notifications.push(...filteredResults);

    logger.debug({ notifications }, "Retrieved notifications");

    lastDate = new Date();

    callback(notifications);
  };

  const broker = getDashboardNotificationRealtimeBroker();

  const customReadable = new ReadableStream({
    start: async (controller) => {
      logger.debug("Initializing SSE stream");
      fn((count) => {
        count.forEach((notification) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(notification)}\n\n`),
          );
        });
      });

      const client = {
        id: v4(),
        organizationId,
        send: (data: DashboardNotification) => {
          logger.debug({ data }, "Received notification");
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        },
      };

      broker.registerClient(organizationId, client);

      request.signal.addEventListener("abort", () => {
        logger.debug("SSE stream aborted by client");
        broker.unregisterClient(organizationId, client);
        controller.close();
      });
    },
    cancel: () => {
      logger.debug("SSE stream cancelled");
    },
  });

  return new Response(customReadable, {
    headers: {
      Connection: "keep-alive",
      "Content-Encoding": "none",
      "Cache-Control": "private, no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}
