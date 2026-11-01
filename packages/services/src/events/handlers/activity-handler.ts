import { claimEventHandler } from "../claim-event-handler";
import { resolveEventDefinition } from "../event-registry";
import type { EventHandler } from "./types";

export const activityHandler: EventHandler = {
  name: "activity",
  async run({ envelope, services, redis, getDbConnection }) {
    const claimed = await claimEventHandler(
      redis,
      envelope.organizationId,
      envelope.id,
      "activity",
    );

    if (!claimed) {
      return;
    }

    const def = resolveEventDefinition(envelope.type);
    if (def?.recordActivity === undefined || def.recordActivity === false) {
      return;
    }
    if (typeof def.recordActivity !== "function") {
      return;
    }

    const result = await def.recordActivity(
      envelope,
      services,
      getDbConnection,
    );

    if (!result) {
      return;
    }

    await services.activityService.record(result);
  },
};
