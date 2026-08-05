import { getLoggerFactory } from "@hacado/logger";
import { claimEventHandler } from "../claim-event-handler";
import { resolveEventDefinition } from "../event-registry";
import type { EventHandler } from "./types";

export const dashboardNotificationHandler: EventHandler = {
  name: "dashboard",
  async run({ envelope, services, redis, getDbConnection }) {
    const logger = getLoggerFactory("Events/DashboardNotificationHandler")(
      "run",
    );
    const claimed = await claimEventHandler(
      redis,
      envelope.organizationId,
      envelope.id,
      "dashboard",
    );
    if (!claimed) {
      return;
    }

    const def = resolveEventDefinition(envelope.type);
    if (
      !def?.dashboardNotification ||
      typeof def.dashboardNotification !== "function"
    ) {
      return;
    }

    try {
      const notification = await def.dashboardNotification(
        envelope,
        services,
        getDbConnection,
      );
      if (notification) {
        await services.dashboardNotificationsService.publishNotification(
          notification,
        );
      }
    } catch (error) {
      logger.error({ error }, "Error publishing dashboard notification");
    }
  },
};
