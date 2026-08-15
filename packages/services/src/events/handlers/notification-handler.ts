import { getLoggerFactory } from "@hacado/logger";
import { claimEventHandler } from "../claim-event-handler";
import { resolveEventDefinition } from "../event-registry";
import type { EventHandler } from "./types";

export const notificationHandler: EventHandler = {
  name: "notifications",
  async run({ envelope, services, redis, getDbConnection }) {
    const logger = getLoggerFactory("Events/NotificationHandler")("run");
    const def = resolveEventDefinition(envelope.type);
    if (!def) {
      return;
    }

    if (typeof def.emailNotifications === "function") {
      const claimed = await claimEventHandler(
        redis,
        envelope.organizationId,
        envelope.id,
        "email",
      );
      if (claimed) {
        try {
          const emails = await def.emailNotifications(
            envelope,
            services,
            getDbConnection,
          );
          if (emails && emails.length > 0) {
            await Promise.all(
              emails.map((email) =>
                services.notificationService.sendEmail(email),
              ),
            );
          }
        } catch (error) {
          logger.error({ error }, "Error sending email notifications");
        }
      }
    }

    if (typeof def.smsNotifications === "function") {
      const claimed = await claimEventHandler(
        redis,
        envelope.organizationId,
        envelope.id,
        "sms",
      );
      if (claimed) {
        try {
          const smses = await def.smsNotifications(
            envelope,
            services,
            getDbConnection,
          );
          if (smses && smses.length > 0) {
            await Promise.all(
              smses.map((sms) =>
                services.notificationService.sendTextMessage(sms),
              ),
            );
          }
        } catch (error) {
          logger.error({ error }, "Error sending SMS notifications");
        }
      }
    }
  },
};
