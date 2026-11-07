import { getLoggerFactory } from "@hacado/logger";
import { claimEventHandler } from "../claim-event-handler";
import { resolveEventDefinition } from "../event-registry";
import type { EventHandler } from "./types";

export const pushNotificationHandler: EventHandler = {
  name: "push",
  async run({ envelope, services, redis, getDbConnection }) {
    const logger = getLoggerFactory("Events/PushNotificationHandler")("run");

    const claimed = await claimEventHandler(
      redis,
      envelope.organizationId,
      envelope.id,
      "push",
    );

    if (!claimed) {
      return;
    }

    const def = resolveEventDefinition(envelope.type);
    if (!def?.pushNotification || typeof def.pushNotification !== "function") {
      return;
    }

    try {
      const notification = await def.pushNotification(
        envelope,
        services,
        getDbConnection,
      );

      if (notification) {
        await services.pushNotificationsService.deliver(notification);
      }
    } catch (error) {
      logger.error({ error }, "Error delivering push notification");
    }
  },
};
