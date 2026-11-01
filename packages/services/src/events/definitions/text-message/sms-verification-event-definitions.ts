import { renderUserEmailTemplate } from "@hacado/email-builder/static";
import type { BaseAllKeys } from "@hacado/i18n/keys";

import { getI18nAsync } from "@hacado/i18n/server";
import type { ActivitySeverity } from "@hacado/types/activity";
import type {
  EventDefinition,
  EventEnvelope,
  SmsVerificationStatusPayload,
} from "@hacado/types/events";
import {
  SMS_VERIFICATION_CREATED_EVENT_TYPE,
  SMS_VERIFICATION_FAILED_EVENT_TYPE,
  SMS_VERIFICATION_PENDING_EVENT_TYPE,
  SMS_VERIFICATION_SUCCEEDED_EVENT_TYPE,
} from "@hacado/types/events";
import type {
  EmailNotificationRequest,
  IServicesContainer,
} from "@hacado/types/services";
import { getAdminUrl } from "@hacado/utils/website";
import { dashboardUrls } from "../links";

const verificationUrl = `${dashboardUrls.textMessagingVerification}`;

const activity = (
  envelope: EventEnvelope,
  title: BaseAllKeys,
  description: BaseAllKeys,
  severity: ActivitySeverity,
) => {
  const { phoneNumber, reason } =
    envelope.payload as SmsVerificationStatusPayload;

  return {
    eventId: envelope.id,
    eventType: envelope.type,
    title: { key: title },
    description: {
      key: description,
      args: { phoneNumber: phoneNumber || "", reason: reason || "" },
    },
    source: envelope.source,
    severity,
    link: verificationUrl,
  };
};

const outcomeNotification = (
  envelope: EventEnvelope,
  type: string,
  toast: "error" | "success",
  keyPrefix:
    | "admin.settings.textMessaging.notifications.failed"
    | "admin.settings.textMessaging.notifications.succeeded",
) => {
  const { reason } = envelope.payload as SmsVerificationStatusPayload;
  return {
    type,
    toast: {
      type: toast,
      title: { key: `${keyPrefix}.title` as BaseAllKeys },
      message: {
        key: `${keyPrefix}.message` as BaseAllKeys,
        args: { reason: reason || "" },
      },
      action: {
        label: { key: `${keyPrefix}.action` as BaseAllKeys },
        href: verificationUrl,
      },
    },
  };
};

async function adminEmails(
  envelope: EventEnvelope,
  services: IServicesContainer,
  keyPrefix:
    | "admin.settings.textMessaging.emails.failed"
    | "admin.settings.textMessaging.emails.succeeded",
): Promise<EmailNotificationRequest[] | null> {
  const admins = await services.teamService.getOrganizationAdminContacts();
  if (!admins.length) return null;

  const { reason } = envelope.payload as SmsVerificationStatusPayload;
  const organization = await services.organizationService.getOrganization();
  const organizationLabel =
    organization?.name?.trim() || organization?.slug || "";

  const url = `${getAdminUrl()}${verificationUrl}`;
  const notifications: EmailNotificationRequest[] = [];

  for (const admin of admins) {
    if (!admin.email) continue;

    const t = await getI18nAsync({ locale: admin.language });
    const args = { reason: reason || "" };
    const subject = t(`${keyPrefix}.subject`, args);
    const body = await renderUserEmailTemplate(
      {
        previewText: t(`${keyPrefix}.preview`, args),
        content: [
          {
            type: "title",
            text: t(`${keyPrefix}.title`, args),
            level: "h2",
          },
          { type: "text", text: t(`${keyPrefix}.body`, args) },
          {
            type: "button",
            button: {
              text: t(`${keyPrefix}.button`, args),
              url,
            },
          },
        ],
      },
      { config: organizationLabel ? { name: organizationLabel } : {} },
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

export const SMS_VERIFICATION_EVENT_DEFINITIONS: Record<
  string,
  EventDefinition
> = {
  [SMS_VERIFICATION_CREATED_EVENT_TYPE]: {
    type: SMS_VERIFICATION_CREATED_EVENT_TYPE,
    recordActivity: (envelope) =>
      activity(
        envelope,
        "admin.platformEvents.smsVerification.created.title",
        "admin.platformEvents.smsVerification.created.description",
        "info",
      ),
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [SMS_VERIFICATION_PENDING_EVENT_TYPE]: {
    type: SMS_VERIFICATION_PENDING_EVENT_TYPE,
    recordActivity: (envelope) =>
      activity(
        envelope,
        "admin.platformEvents.smsVerification.pending.title",
        "admin.platformEvents.smsVerification.pending.description",
        "warning",
      ),
    dashboardNotification: false,
    emailNotifications: false,
    smsNotifications: false,
  },
  [SMS_VERIFICATION_FAILED_EVENT_TYPE]: {
    type: SMS_VERIFICATION_FAILED_EVENT_TYPE,
    recordActivity: (envelope) =>
      activity(
        envelope,
        "admin.platformEvents.smsVerification.failed.title",
        "admin.platformEvents.smsVerification.failed.description",
        "error",
      ),
    dashboardNotification: (envelope) =>
      outcomeNotification(
        envelope,
        "sms-verification-failed",
        "error",
        "admin.settings.textMessaging.notifications.failed",
      ),
    emailNotifications: (envelope, services) =>
      adminEmails(
        envelope,
        services,
        "admin.settings.textMessaging.emails.failed",
      ),
    smsNotifications: false,
  },
  [SMS_VERIFICATION_SUCCEEDED_EVENT_TYPE]: {
    type: SMS_VERIFICATION_SUCCEEDED_EVENT_TYPE,
    recordActivity: (envelope) =>
      activity(
        envelope,
        "admin.platformEvents.smsVerification.succeeded.title",
        "admin.platformEvents.smsVerification.succeeded.description",
        "success",
      ),
    dashboardNotification: (envelope) =>
      outcomeNotification(
        envelope,
        "sms-verification-succeeded",
        "success",
        "admin.settings.textMessaging.notifications.succeeded",
      ),
    emailNotifications: (envelope, services) =>
      adminEmails(
        envelope,
        services,
        "admin.settings.textMessaging.emails.succeeded",
      ),
    smsNotifications: false,
  },
};
