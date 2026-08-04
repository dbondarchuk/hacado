import { AvailableApps } from "@timelish/app-store";
import { renderUserEmailTemplate } from "@timelish/email-builder/static";
import { BaseAllKeys, fallbackLanguage, type Language } from "@timelish/i18n";
import { getI18nAsync } from "@timelish/i18n/server";
import {
  APP_CONNECTED_EVENT_TYPE,
  APP_FAILED_EVENT_TYPE,
  APP_INSTALLED_EVENT_TYPE,
  APP_UNINSTALLED_EVENT_TYPE,
  type AppConnectedPayload,
  type AppFailedPayload,
  type AppInstalledPayload,
  type AppUninstalledPayload,
  type EventDefinition,
} from "@timelish/types";
import { getAdminUrl } from "@timelish/utils";

export const APP_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [APP_INSTALLED_EVENT_TYPE]: {
    type: APP_INSTALLED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const payload = envelope.payload as AppInstalledPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.apps.events.installed.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.apps.events.installed.description" satisfies BaseAllKeys,
          args: {
            appName: payload.appName,
            t_appDisplayName:
              AvailableApps[payload.appName]?.displayName ?? payload.appName,
          },
        },
        severity: "success",
        source: envelope.source,
        link: "/dashboard/apps",
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [APP_CONNECTED_EVENT_TYPE]: {
    type: APP_CONNECTED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const payload = envelope.payload as AppConnectedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.apps.events.connected.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.apps.events.connected.description" satisfies BaseAllKeys,
          args: {
            appName: payload.appName,
            t_appDisplayName:
              AvailableApps[payload.appName]?.displayName ?? payload.appName,
          },
        },
        source: envelope.source,
        severity: "success",
        link: "/dashboard/apps",
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [APP_UNINSTALLED_EVENT_TYPE]: {
    type: APP_UNINSTALLED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const payload = envelope.payload as AppUninstalledPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.apps.events.uninstalled.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.apps.events.uninstalled.description" satisfies BaseAllKeys,
          args: {
            appName: payload.appName,
            t_appDisplayName:
              AvailableApps[payload.appName]?.displayName ?? payload.appName,
          },
        },
        source: envelope.source,
        severity: "warning",
        link: "/dashboard/apps",
      };
    },
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [APP_FAILED_EVENT_TYPE]: {
    type: APP_FAILED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const payload = envelope.payload as AppFailedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.apps.events.failed.title" satisfies BaseAllKeys,
        },
        description: {
          key: "admin.apps.events.failed.description" satisfies BaseAllKeys,
          args: {
            appName: payload.appName,
            t_appDisplayName:
              AvailableApps[payload.appName]?.displayName ?? payload.appName,
          },
        },
        source: envelope.source,
        severity: "error",
        link: "/dashboard/apps",
      };
    },
    dashboardNotification: async (envelope) => {
      const payload = envelope.payload as AppFailedPayload;
      return {
        type: "app-failed",
        toast: {
          type: "error",
          title: {
            key: "admin.apps.notifications.failed.title" satisfies BaseAllKeys,
          },
          message: {
            key: "admin.apps.notifications.failed.message" satisfies BaseAllKeys,
            args: {
              appName: payload.appName,
              t_appDisplayName:
                AvailableApps[payload.appName]?.displayName ?? payload.appName,
            },
          },
          action: {
            label: {
              key: "admin.apps.notifications.failed.action" satisfies BaseAllKeys,
            },
            href: "/dashboard/apps",
          },
        },
      };
    },
    emailNotifications: async (envelope, services) => {
      const payload = envelope.payload as AppFailedPayload;
      let ownerMemberId = payload.memberId;

      if (!ownerMemberId) {
        try {
          const app = await services.connectedAppsService.getApp(payload.appId);
          ownerMemberId = app.memberId;
        } catch {
          return null;
        }
      }

      if (!ownerMemberId) {
        return null;
      }

      const owner =
        await services.teamService.getMemberById(ownerMemberId);
      if (!owner?.email) {
        return null;
      }

      const locale: Language =
        owner.language === "uk" || owner.language === "en"
          ? owner.language
          : fallbackLanguage;

      const t = await getI18nAsync({ locale });

      const organization = await services.organizationService.getOrganization();
      const organizationLabel =
        organization?.name?.trim() || organization?.slug || "";

      const appDisplayNameKey = AvailableApps[payload.appName]?.displayName;
      const appDisplayName = t.has(appDisplayNameKey)
        ? t(appDisplayNameKey)
        : payload.appName;

      const interpolation = { appDisplayName, userName: owner.name };
      const layoutArgs = {
        config: organizationLabel ? { name: organizationLabel } : {},
      };

      const subject = t("admin.apps.emails.failed.subject", interpolation);
      const body = await renderUserEmailTemplate(
        {
          previewText: t("admin.apps.emails.failed.preview", interpolation),
          content: [
            {
              type: "title",
              text: t("admin.apps.emails.failed.title", interpolation),
              level: "h2",
            },
            {
              type: "text",
              text: t("admin.apps.emails.failed.body", interpolation),
            },
            {
              type: "button",
              button: {
                text: t("admin.apps.emails.failed.button"),
                url: `${getAdminUrl()}/dashboard/apps`,
              },
            },
          ],
        },
        layoutArgs,
      );

      return [
        {
          email: {
            to: owner.email,
            subject,
            body,
          },
          handledBy: {
            key: "admin.apps.emails.failed.handledBy" satisfies BaseAllKeys,
            args: { appDisplayName },
          },
          participantType: "member" as const,
          memberId: ownerMemberId,
        },
      ];
    },
    smsNotifications: false,
  },
};
