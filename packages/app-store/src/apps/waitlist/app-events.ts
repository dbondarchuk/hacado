import type { NotificationAudience } from "@hacado/types/apps";
import type { AppEventConfig, EventDefinition } from "@hacado/types/events";
import type { IServicesContainer } from "@hacado/types/services";
import { buildNewWaitlistEntryEmailNotifications } from "./emails/new-entry-email";
import type { WaitlistConfiguration } from "./models";
import {
  WAITLIST_ENTRIES_DISMISSED_EVENT_TYPE,
  WAITLIST_ENTRY_CREATED_EVENT_TYPE,
  WaitlistEntriesDismissedEvent,
  WaitlistEntryCreatedEvent,
} from "./models/events";
import { WaitlistRepositoryService } from "./service/repository-service";
import { WaitlistAdminAllKeys } from "./translations/types";

const COORDINATOR_AND_ABOVE = ["owner", "admin", "coordinator"] as const;

async function resolveWaitlistNewEntryAudience(
  entry: WaitlistEntryCreatedEvent["payload"]["entry"],
  services: IServicesContainer,
): Promise<NotificationAudience> {
  let app;
  try {
    app = await services.connectedAppsService.getApp(entry.appId);
  } catch {
    if (entry.member?._id) {
      return { memberIds: [entry.member._id] };
    }

    const coordinators =
      await services.teamService.getOrganizationMemberContacts([
        ...COORDINATOR_AND_ABOVE,
      ]);

    return { memberIds: coordinators.map((contact) => contact.memberId) };
  }

  const settings = (app.data ?? {}) as Partial<WaitlistConfiguration>;
  const notifyMember = Boolean(settings.notifyMemberOnNewEntry);
  const notifyCoordinators = Boolean(settings.notifyCoordinatorsOnNewEntry);

  const memberIds = new Set<string>();

  if (notifyMember && entry.member?._id) {
    memberIds.add(entry.member._id);
  }

  if (notifyCoordinators) {
    const coordinators =
      await services.teamService.getOrganizationMemberContacts([
        ...COORDINATOR_AND_ABOVE,
      ]);

    for (const contact of coordinators) {
      memberIds.add(contact.memberId);
    }
  }

  if (memberIds.size > 0) {
    return { memberIds: [...memberIds] };
  }

  if (entry.member?._id) {
    return { memberIds: [entry.member._id] };
  }

  const coordinators = await services.teamService.getOrganizationMemberContacts(
    [...COORDINATOR_AND_ABOVE],
  );

  return { memberIds: coordinators.map((contact) => contact.memberId) };
}

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
            serviceName: envelope.payload.entry.service.name,
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

        const audience = await resolveWaitlistNewEntryAudience(
          envelope.payload.entry,
          services,
        );

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
          audience,
        };
      },
      pushNotification: async (envelope, services) => {
        const audience = await resolveWaitlistNewEntryAudience(
          envelope.payload.entry,
          services,
        );

        return {
          title: {
            key: "app_waitlist_admin.notifications.newEntry" satisfies WaitlistAdminAllKeys,
          },
          body: {
            key: "app_waitlist_admin.notifications.newEntryMessage" satisfies WaitlistAdminAllKeys,
          },
          url: `/dashboard?activeTab=waitlist&key=${Date.now()}`,
          tag: WAITLIST_ENTRY_CREATED_EVENT_TYPE,
          audience,
        };
      },
      emailNotifications: async (envelope, services) => {
        const { entry } = envelope.payload;
        let app;
        try {
          app = await services.connectedAppsService.getApp(entry.appId);
        } catch {
          return null;
        }

        const settings = (app.data ?? {}) as Partial<WaitlistConfiguration>;
        const notifyMember = Boolean(settings.notifyMemberOnNewEntry);
        const notifyCoordinators = Boolean(
          settings.notifyCoordinatorsOnNewEntry,
        );

        if (!notifyMember && !notifyCoordinators) {
          return null;
        }

        const recipientsById = new Map<
          string,
          {
            memberId: string;
            email: string;
            name: string;
            language?: string | null;
          }
        >();

        if (notifyMember && entry.member?.email) {
          recipientsById.set(entry.member._id, {
            memberId: entry.member._id,
            email: entry.member.email,
            name: entry.member.name || entry.member.email,
            language: entry.member.language,
          });
        }

        if (notifyCoordinators) {
          const coordinators =
            await services.teamService.getOrganizationMemberContacts([
              ...COORDINATOR_AND_ABOVE,
            ]);

          for (const contact of coordinators) {
            recipientsById.set(contact.memberId, contact);
          }
        }

        const recipients = [...recipientsById.values()];
        if (!recipients.length) {
          return null;
        }

        const organization =
          await services.organizationService.getOrganization();

        const organizationLabel =
          organization?.name?.trim() || organization?.slug || "";

        return buildNewWaitlistEntryEmailNotifications(
          entry,
          recipients,
          organizationLabel ? { config: { name: organizationLabel } } : {},
        );
      },
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
