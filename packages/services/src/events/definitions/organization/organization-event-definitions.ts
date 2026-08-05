import { BaseAllKeys } from "@hacado/i18n";
import {
  ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE,
  type EventDefinition,
  type OrganizationDomainChangedPayload,
} from "@hacado/types";
import { dashboardUrls } from "../links";

export const ORGANIZATION_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE]: {
    type: ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const payload = envelope.payload as OrganizationDomainChangedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.organization.domainChanged.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.organization.domainChanged.description" satisfies BaseAllKeys,
          args: {
            previousDomain: payload.previousDomain ?? "-",
            newDomain: payload.newDomain ?? "-",
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
