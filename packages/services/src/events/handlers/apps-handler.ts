import {
  BUILT_IN_APP_EVENT_IDS,
  getAppNamesSubscribedToEventType,
} from "@hacado/app-store/app-events";
import { getLoggerFactory } from "@hacado/logger";
import { claimEventHandler } from "../claim-event-handler";
import type { EventHandler } from "./types";

const logger = getLoggerFactory("AppsEventHandler")("run");

export const appsHandler: EventHandler = {
  name: "apps",
  async run({ envelope, services, redis }) {
    const claimed = await claimEventHandler(
      redis,
      envelope.organizationId,
      envelope.id,
      "apps",
    );
    if (!claimed) {
      return;
    }

    const candidateNames = getAppNamesSubscribedToEventType(envelope.type);
    if (candidateNames.length === 0) {
      return;
    }

    await Promise.all(
      candidateNames.map(async (name) => {
        if (BUILT_IN_APP_EVENT_IDS.has(name)) {
          try {
            await services.jobService.scheduleJob({
              type: "event",
              appId: name,
              eventType: envelope.type,
              envelope,
              executeAt: "now",
            });
          } catch (error) {
            logger.error(
              { error, appId: name, eventType: envelope.type },
              "Failed to enqueue built-in app event job",
            );
          }
        }

        const installs = await services.connectedAppsService.getAppsByApp(name);
        await Promise.all(
          installs.map(async (app) => {
            try {
              return await services.jobService.scheduleJob({
                type: "event",
                appId: app._id,
                eventType: envelope.type,
                envelope,
                executeAt: "now",
              });
            } catch (error) {
              logger.error(
                { error, appId: app._id, eventType: envelope.type },
                "Failed to enqueue app event job",
              );
            }
          }),
        );
      }),
    );
  },
};
