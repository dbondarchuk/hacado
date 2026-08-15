import { renderUserEmailTemplate } from "@hacado/email-builder/static";
import { BaseAllKeys } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import {
  SMS_CREDITS_EXHAUSTED_EVENT_TYPE,
  SMS_CREDITS_LOW_EVENT_TYPE,
  SMS_TOPUP_PURCHASED_EVENT_TYPE,
  type EmailNotificationRequest,
  type EventDefinition,
  type EventEnvelope,
  type IServicesContainer,
  type SmsCreditsThresholdPayload,
  type SmsTopupPurchasedPayload,
} from "@hacado/types";
import { getAdminUrl } from "@hacado/utils";

import { dashboardUrls } from "../links";

function smsCreditsEmailKeyPrefix(eventType: string) {
  return eventType === SMS_CREDITS_EXHAUSTED_EVENT_TYPE
    ? ("admin.billing.emails.smsCreditsExhausted" as const)
    : ("admin.billing.emails.smsCreditsLow" as const);
}

function smsCreditsActivityKeyPrefix(eventType: string) {
  return eventType === SMS_CREDITS_EXHAUSTED_EVENT_TYPE
    ? ("admin.platformEvents.billing.smsCreditsExhausted" as const)
    : ("admin.platformEvents.billing.smsCreditsLow" as const);
}

function smsCreditsNotificationKeyPrefix(eventType: string) {
  return eventType === SMS_CREDITS_EXHAUSTED_EVENT_TYPE
    ? ("admin.billing.notifications.smsCreditsExhausted" as const)
    : ("admin.billing.notifications.smsCreditsLow" as const);
}

async function buildSmsCreditThresholdEmails(
  envelope: EventEnvelope<SmsCreditsThresholdPayload>,
  services: IServicesContainer,
): Promise<EmailNotificationRequest[] | null> {
  const admins = await services.teamService.getOrganizationAdminContacts();
  if (!admins.length) return null;

  const organization = await services.organizationService.getOrganization();
  const organizationLabel =
    organization?.name?.trim() || organization?.slug || "";
  const layoutArgs = {
    config: organizationLabel ? { name: organizationLabel } : {},
  };

  const keyPrefix = smsCreditsEmailKeyPrefix(envelope.type);
  const interpolation = { balance: envelope.payload.balance };

  const notifications: EmailNotificationRequest[] = [];
  for (const admin of admins) {
    if (!admin.email) continue;
    const t = await getI18nAsync({ locale: admin.language });
    const subject = t(`${keyPrefix}.subject`, interpolation);
    const body = await renderUserEmailTemplate(
      {
        previewText: t(`${keyPrefix}.preview`, interpolation),
        content: [
          {
            type: "title",
            text: t(`${keyPrefix}.title`, interpolation),
            level: "h2",
          },
          {
            type: "text",
            text: t(`${keyPrefix}.body`, interpolation),
          },
          {
            type: "button",
            button: {
              text: t(`${keyPrefix}.button`, interpolation),
              url: `${getAdminUrl()}${dashboardUrls.billing}`,
            },
          },
          {
            type: "button",
            button: {
              text: t(`${keyPrefix}.purchaseButton`, interpolation),
              url: `${getAdminUrl()}${dashboardUrls.billingPurchaseSmsTopup}`,
              textColor: "#ffffff",
              backgroundColor: "#059669",
            },
          },
        ],
      },
      layoutArgs,
    );

    notifications.push({
      email: { to: admin.email, subject, body },
      handledBy: `${keyPrefix}.handledBy` as BaseAllKeys,
      participantType: "member",
      memberId: admin.memberId,
    });
  }

  return notifications.length ? notifications : null;
}

function buildSmsCreditThresholdActivity(
  envelope: EventEnvelope<SmsCreditsThresholdPayload>,
): {
  eventId: string;
  eventType: string;
  title: { key: BaseAllKeys };
  description: { key: BaseAllKeys; args: { balance: number } };
  source: EventEnvelope["source"];
  severity: "warning" | "error";
  link: string;
} {
  const balance = envelope.payload.balance;
  const exhausted = envelope.type === SMS_CREDITS_EXHAUSTED_EVENT_TYPE;
  const keyPrefix = smsCreditsActivityKeyPrefix(envelope.type);
  return {
    eventId: envelope.id,
    eventType: envelope.type,
    title: {
      key: `${keyPrefix}.title` as BaseAllKeys,
    },
    description: {
      key: `${keyPrefix}.description` as BaseAllKeys,
      args: { balance },
    },
    source: envelope.source,
    severity: exhausted ? "error" : "warning",
    link: dashboardUrls.billing,
  };
}

export const BILLING_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  [SMS_CREDITS_LOW_EVENT_TYPE]: {
    type: SMS_CREDITS_LOW_EVENT_TYPE,
    recordActivity: (envelope) =>
      buildSmsCreditThresholdActivity(
        envelope as EventEnvelope<SmsCreditsThresholdPayload>,
      ),
    dashboardNotification: async (envelope) => {
      const keyPrefix = smsCreditsNotificationKeyPrefix(envelope.type);
      const payload = envelope.payload as SmsCreditsThresholdPayload;
      return {
        type: "billing-sms-credits-low",
        toast: {
          type: "warning" as const,
          title: {
            key: `${keyPrefix}.title` as BaseAllKeys,
          },
          message: {
            key: `${keyPrefix}.message` as BaseAllKeys,
            args: { balance: payload.balance },
          },
          action: {
            label: {
              key: `${keyPrefix}.action` as BaseAllKeys,
            },
            href: dashboardUrls.billing,
          },
        },
      };
    },
    emailNotifications: async (envelope, services) =>
      await buildSmsCreditThresholdEmails(envelope, services),
    smsNotifications: false,
  },
  [SMS_CREDITS_EXHAUSTED_EVENT_TYPE]: {
    type: SMS_CREDITS_EXHAUSTED_EVENT_TYPE,
    recordActivity: (envelope) =>
      buildSmsCreditThresholdActivity(
        envelope as EventEnvelope<SmsCreditsThresholdPayload>,
      ),
    dashboardNotification: async (envelope) => {
      const keyPrefix = smsCreditsNotificationKeyPrefix(envelope.type);
      const payload = envelope.payload as SmsCreditsThresholdPayload;
      return {
        type: "billing-sms-credits-exhausted",
        toast: {
          type: "error" as const,
          title: {
            key: `${keyPrefix}.title` as BaseAllKeys,
          },
          message: {
            key: `${keyPrefix}.message` as BaseAllKeys,
            args: { balance: payload.balance },
          },
          action: {
            label: {
              key: `${keyPrefix}.action` as BaseAllKeys,
            },
            href: dashboardUrls.billing,
          },
        },
      };
    },
    emailNotifications: async (envelope, services) =>
      await buildSmsCreditThresholdEmails(envelope, services),
    smsNotifications: false,
  },
  [SMS_TOPUP_PURCHASED_EVENT_TYPE]: {
    type: SMS_TOPUP_PURCHASED_EVENT_TYPE,
    recordActivity: (envelope) => {
      const { credits } = envelope.payload as SmsTopupPurchasedPayload;
      return {
        eventId: envelope.id,
        eventType: envelope.type,
        title: {
          key: "admin.platformEvents.billing.smsTopupPurchased.title" as BaseAllKeys,
        },
        description: {
          key: "admin.platformEvents.billing.smsTopupPurchased.description" as BaseAllKeys,
          args: { credits },
        },
        source: envelope.source,
        severity: "success",
        link: dashboardUrls.billing,
      };
    },
    dashboardNotification: async (envelope) => {
      const { credits } = envelope.payload as SmsTopupPurchasedPayload;

      // Wait for 5 seconds to make sure the user gets the notification
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return {
        type: "billing-sms-topup-purchased",
        toast: {
          type: "success" as const,
          title: {
            key: "admin.billing.notifications.smsTopupPurchased.title" as BaseAllKeys,
          },
          message: {
            key: "admin.billing.notifications.smsTopupPurchased.message" as BaseAllKeys,
            args: { credits },
          },
          action: {
            label: {
              key: "admin.billing.notifications.smsTopupPurchased.action" as BaseAllKeys,
            },
            href: dashboardUrls.billing,
          },
        },
      };
    },
    emailNotifications: false,
    smsNotifications: false,
  },
};
