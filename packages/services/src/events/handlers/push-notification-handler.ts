import { getLoggerFactory } from "@hacado/logger";
import { claimEventHandler } from "../claim-event-handler";
import { resolveEventDefinition } from "../event-registry";
import type { EventHandler } from "./types";

export const pushNotificationHandler: EventHandler = {
  name: "push",
  async run({ envelope, services, redis, getDbConnection }) {
    const logger = getLoggerFactory("Events/PushNotificationHandler")("run");
    logger.debug(
      {
        eventId: envelope.id,
        eventType: envelope.type,
        organizationId: envelope.organizationId,
      },
      "Handling push notification event",
    );

    const claimed = await claimEventHandler(
      redis,
      envelope.organizationId,
      envelope.id,
      "push",
    );

    if (!claimed) {
      logger.debug(
        { eventId: envelope.id, eventType: envelope.type },
        "Push handler already claimed; skipping",
      );

      return;
    }

    const def = resolveEventDefinition(envelope.type);
    if (!def?.pushNotification || typeof def.pushNotification !== "function") {
      logger.debug(
        { eventId: envelope.id, eventType: envelope.type },
        "Event has no pushNotification definition; skipping",
      );

      return;
    }

    try {
      const notification = await def.pushNotification(
        envelope,
        services,
        getDbConnection,
      );

      if (!notification) {
        logger.debug(
          { eventId: envelope.id, eventType: envelope.type },
          "pushNotification returned no payload; skipping",
        );

        return;
      }

      logger.debug(
        {
          eventId: envelope.id,
          eventType: envelope.type,
          url: notification.url,
          tag: notification.tag,
          audience: notification.audience,
        },
        "Preparing push notification deliveries",
      );

      const deliveries =
        await services.pushNotificationsService.prepareDeliveries(notification);

      if (deliveries.length === 0) {
        logger.debug(
          { eventId: envelope.id, eventType: envelope.type },
          "No push deliveries to enqueue",
        );

        return;
      }

      logger.debug(
        {
          eventId: envelope.id,
          eventType: envelope.type,
          deliveryCount: deliveries.length,
        },
        "Enqueueing push notification deliveries",
      );

      await Promise.all(
        deliveries.map((delivery) =>
          services.notificationService.sendPush(delivery),
        ),
      );
    } catch (error) {
      logger.error(
        {
          error,
          eventId: envelope.id,
          eventType: envelope.type,
          organizationId: envelope.organizationId,
        },
        "Error preparing or enqueueing push notifications",
      );
    }
  },
};
