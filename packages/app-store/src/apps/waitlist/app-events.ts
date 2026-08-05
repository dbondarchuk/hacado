import { type AppEventConfig, type EventDefinition } from "@hacado/types";
import {
  WAITLIST_ENTRIES_DISMISSED_EVENT_TYPE,
  WAITLIST_ENTRY_CREATED_EVENT_TYPE,
  WaitlistEntriesDismissedEvent,
  WaitlistEntryCreatedEvent,
} from "./models/events";
import { WaitlistRepositoryService } from "./service/repository-service";
import { WaitlistAdminAllKeys } from "./translations/types";

export const WAITLIST_APP_EVENTS: AppEventConfig = {
  events: [
    {
      type: WAITLIST_ENTRY_CREATED_EVENT_TYPE,
      recordActivity: (envelope) => ({
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "app_waitlist_admin.activity.newEntry.title" satisfies WaitlistAdminAllKeys,
        },
        description: {
          key: "app_waitlist_admin.activity.newEntry.description" satisfies WaitlistAdminAllKeys,
          args: {
            customerName: envelope.payload.entry.customer.name,
            serviceName: envelope.payload.entry.option.name,
          },
        },
        source: envelope.source,
      }),
      dashboardNotification: async (envelope, services, getDbConnection) => {
        const repositoryService = new WaitlistRepositoryService(
          envelope.payload.entry.appId,
          envelope.organizationId,
          getDbConnection,
          services,
        );

        const waitlistEntriesCount =
          await repositoryService.getWaitlistEntriesCount(new Date());

        return {
          type: "waitlist-entries",
          badges: [
            {
              key: "waitlist_entries",
              count: waitlistEntriesCount.totalCount,
            },
          ],
          toast: {
            type: "info",
            title: {
              key: "app_waitlist_admin.notifications.newEntry" satisfies WaitlistAdminAllKeys,
            },
            message: {
              key: "app_waitlist_admin.notifications.newEntryMessage" satisfies WaitlistAdminAllKeys,
            },
            action: {
              label: {
                key: "app_waitlist_admin.notifications.viewWaitlist" satisfies WaitlistAdminAllKeys,
              },
              href: `/dashboard?activeTab=waitlist&key=${Date.now()}`,
            },
          },
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<WaitlistEntryCreatedEvent["payload"]>,
    {
      type: WAITLIST_ENTRIES_DISMISSED_EVENT_TYPE,
      recordActivity: (envelope) => ({
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "app_waitlist_admin.activity.entriesDismissed.title" satisfies WaitlistAdminAllKeys,
        },
        description: {
          key: "app_waitlist_admin.activity.entriesDismissed.description" satisfies WaitlistAdminAllKeys,
          args: {
            count: envelope.payload.entries.length,
          },
        },
        source: envelope.source,
      }),
      dashboardNotification: async (envelope, services, getDbConnection) => {
        if (envelope.payload.entries.length === 0) {
          return null;
        }

        const repositoryService = new WaitlistRepositoryService(
          envelope.payload.entries[0].appId,
          envelope.organizationId,
          getDbConnection,
          services,
        );

        const waitlistEntriesCount =
          await repositoryService.getWaitlistEntriesCount(new Date());

        return {
          type: "waitlist-entries",
          badges: [
            {
              key: "waitlist_entries",
              count: waitlistEntriesCount.totalCount,
            },
          ],
        };
      },
      emailNotifications: false,
      smsNotifications: false,
    } as EventDefinition<WaitlistEntriesDismissedEvent["payload"]>,
  ],
};
