import { renderUserEmailTemplate } from "@timelish/email-builder/static";
import { BaseAllKeys, fallbackLanguage, type Language } from "@timelish/i18n";
import { getI18nAsync } from "@timelish/i18n/server";
import {
  OrganizationSubscriptionStatus,
  SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE,
  type EmailNotificationRequest,
  type EventDefinition,
  type SubscriptionStatusChangedPayload,
} from "@timelish/types";
import { getAdminUrl } from "@timelish/utils";

import { dashboardUrls } from "../links";

const CONCERNING_SUBSCRIPTION_STATUSES =
  new Set<OrganizationSubscriptionStatus>([
    OrganizationSubscriptionStatus.Canceled,
    OrganizationSubscriptionStatus.PastDue,
    OrganizationSubscriptionStatus.Unpaid,
    OrganizationSubscriptionStatus.Incomplete,
    OrganizationSubscriptionStatus.IncompleteExpired,
  ]);

function isConcerningSubscriptionStatus(
  status: OrganizationSubscriptionStatus,
): boolean {
  return CONCERNING_SUBSCRIPTION_STATUSES.has(status);
}

export const SUBSCRIPTION_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE]: {
    type: SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const payload = envelope.payload as SubscriptionStatusChangedPayload;
      const { oldStatus, newStatus, productName } = payload;
      const product = productName?.trim() || "-";
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.subscription.statusChanged.title" as BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.subscription.statusChanged.description" as BaseAllKeys,
          args: {
            product,
            newStatus,
            oldStatus: oldStatus ?? "-",
          },
        },
        source: envelope.source,
        link: dashboardUrls.billing,
        severity: isConcerningSubscriptionStatus(newStatus)
          ? "warning"
          : "info",
      };
    },
    dashboardNotification: async (envelope) => {
      const payload = envelope.payload as SubscriptionStatusChangedPayload;
      const product = payload.productName?.trim() || "-";
      const concerning = isConcerningSubscriptionStatus(payload.newStatus);
      return {
        type: "subscription-status-changed",
        toast: {
          type: concerning ? "warning" : "info",
          title: {
            key: "admin.platformEvents.subscription.statusChanged.title" as BaseAllKeys,
          },
          message: {
            key: "admin.platformEvents.subscription.statusChanged.description" as BaseAllKeys,
            args: {
              product,
              newStatus: payload.newStatus,
              oldStatus: payload.oldStatus ?? "-",
            },
          },
          action: {
            label: {
              key: "admin.billing.emails.subscriptionAlert.button" as BaseAllKeys,
            },
            href: dashboardUrls.billing,
          },
        },
      };
    },
    emailNotifications: async (envelope, services) => {
      const payload = envelope.payload as SubscriptionStatusChangedPayload;
      if (!isConcerningSubscriptionStatus(payload.newStatus)) {
        return null;
      }

      const admins = await services.teamService.getOrganizationAdminContacts();
      if (!admins.length) {
        return null;
      }

      const organization = await services.organizationService.getOrganization();
      const organizationLabel =
        organization?.name?.trim() || organization?.slug || "";

      const layoutArgs = {
        config: organizationLabel ? { name: organizationLabel } : {},
      };

      const productLabel = payload.productName?.trim() || "-";
      const interpolation = {
        product: productLabel,
        newStatus: payload.newStatus,
        oldStatus: payload.oldStatus ?? "-",
      };

      const results: EmailNotificationRequest[] = [];

      for (const admin of admins) {
        if (!admin.email) continue;

        const locale: Language =
          admin.language === "uk" || admin.language === "en"
            ? admin.language
            : fallbackLanguage;

        const t = await getI18nAsync({ locale });

        const subject = t(
          "admin.billing.emails.subscriptionAlert.subject",
          interpolation,
        );
        const body = await renderUserEmailTemplate(
          {
            previewText: t(
              "admin.billing.emails.subscriptionAlert.preview",
              interpolation,
            ),
            content: [
              {
                type: "title",
                text: t(
                  "admin.billing.emails.subscriptionAlert.title",
                  interpolation,
                ),
                level: "h2",
              },
              {
                type: "text",
                text: t(
                  "admin.billing.emails.subscriptionAlert.body",
                  interpolation,
                ),
              },
              {
                type: "button",
                button: {
                  text: t("admin.billing.emails.subscriptionAlert.button"),
                  url: `${getAdminUrl()}${dashboardUrls.billing}`,
                },
              },
            ],
          },
          layoutArgs,
        );

        results.push({
          email: { to: admin.email, subject, body },
          handledBy:
            "admin.billing.emails.subscriptionAlert.handledBy" as BaseAllKeys,
          participantType: "member",
          memberId: admin.memberId,
        });
      }

      return results.length ? results : null;
    },
    smsNotifications: false,
  },
};
