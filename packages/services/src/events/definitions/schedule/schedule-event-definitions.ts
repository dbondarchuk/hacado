import { BaseAllKeys } from "@hacado/i18n";
import {
  SCHEDULE_CHANGED_EVENT_TYPE,
  type EventDefinition,
  type ScheduleChangedPayload,
} from "@hacado/types";

import { dashboardUrls } from "../links";

export const SCHEDULE_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [SCHEDULE_CHANGED_EVENT_TYPE]: {
    type: SCHEDULE_CHANGED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const payload = envelope.payload as ScheduleChangedPayload;
      const memberCount = payload.memberIds?.length ?? 0;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.schedule.changed.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.schedule.changed.description" satisfies BaseAllKeys,
          args: {
            memberCount: String(memberCount),
          },
        },
        source: envelope.source,
        link: dashboardUrls.settings,
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
};
