import {
  EMAIL_BRAND,
  renderUserEmailTemplate,
} from "@hacado/email-builder/static";
import { fallbackLanguage, languages, type Language } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import type { EmailNotificationRequest } from "@hacado/types";
import { durationToTime, getAdminUrl } from "@hacado/utils";
import { DateTime } from "luxon";
import type { WaitlistEntry, WaitlistTime } from "../models";
import { WaitlistAdminAllKeys } from "../translations/types";

type MemberRecipient = {
  memberId: string;
  email: string;
  name: string;
  language?: string | null;
};

const formatWhen = (
  entry: WaitlistEntry,
  t: Awaited<ReturnType<typeof getI18nAsync>>,
): string => {
  if (entry.asSoonAsPossible) {
    return t(
      "app_waitlist_admin.view.asSoonAsPossible" satisfies WaitlistAdminAllKeys,
    );
  }

  const timeLabel = (time: WaitlistTime) =>
    t(
      `app_waitlist_admin.view.times.short.${time}` satisfies WaitlistAdminAllKeys,
    );

  return (
    entry.dates
      ?.map((date) => {
        const day = DateTime.fromISO(date.date).toFormat("DDD");
        const times = date.time?.map(timeLabel).join(", ");
        return times ? `${day}: ${times}` : day;
      })
      .join("\n") || "-"
  );
};

const formatDuration = (entry: WaitlistEntry): string => {
  if (!entry.duration) {
    return "-";
  }
  const { hours, minutes } = durationToTime(entry.duration);
  const parts: string[] = [];
  if (hours) parts.push(`${hours} hr`);
  if (minutes) parts.push(`${minutes} min`);
  return parts.join(" ") || "-";
};

export const buildNewWaitlistEntryEmailNotifications = async (
  entry: WaitlistEntry,
  recipients: MemberRecipient[],
  layoutArgs: Record<string, unknown> = {},
): Promise<EmailNotificationRequest[] | null> => {
  const adminUrl = getAdminUrl();
  const waitlistUrl = `${adminUrl}/dashboard/waitlist`;
  const createAppointmentUrl = `${adminUrl}/dashboard/waitlist/appointment/new?id=${entry._id}`;
  const dismissUrl = `${adminUrl}/dashboard/waitlist/dismiss?id=${entry._id}`;

  const notifications: EmailNotificationRequest[] = [];

  for (const recipient of recipients) {
    if (!recipient.email) {
      continue;
    }

    const locale: Language = languages.includes(recipient.language as Language)
      ? (recipient.language as Language)
      : fallbackLanguage;

    const t = await getI18nAsync({ locale });

    const interpolation = {
      userName: recipient.name,
      customerName: entry.customer?.name?.trim() || entry.name || "-",
      customerEmail: entry.email?.trim() || "-",
      customerPhone: entry.phone?.trim() || "-",
      serviceName: entry.option?.name || "-",
      memberName: entry.member?.name?.trim() || "-",
      addons:
        entry.addons?.map((addon) => addon.name).join(", ") ||
        t(
          "app_waitlist_admin.emails.newEntry.none" satisfies WaitlistAdminAllKeys,
        ),
      note: entry.note?.trim() || "-",
      when: formatWhen(entry, t),
      duration: formatDuration(entry),
    };

    const subject = t(
      "app_waitlist_admin.emails.newEntry.subject" satisfies WaitlistAdminAllKeys,
      interpolation,
    );

    const body = await renderUserEmailTemplate(
      {
        previewText: subject,
        content: [
          {
            type: "title",
            text: t(
              "app_waitlist_admin.emails.newEntry.title" satisfies WaitlistAdminAllKeys,
              interpolation,
            ),
            level: "h2",
          },
          {
            type: "text",
            text: t(
              "app_waitlist_admin.emails.newEntry.body" satisfies WaitlistAdminAllKeys,
              interpolation,
            ),
          },
          {
            type: "button",
            button: {
              text: t(
                "app_waitlist_admin.emails.newEntry.view" satisfies WaitlistAdminAllKeys,
              ),
              url: waitlistUrl,
            },
          },
          {
            type: "button",
            button: {
              text: t(
                "app_waitlist_admin.emails.newEntry.createAppointment" satisfies WaitlistAdminAllKeys,
              ),
              url: createAppointmentUrl,
              backgroundColor: EMAIL_BRAND.primary,
            },
          },
          {
            type: "button",
            button: {
              text: t(
                "app_waitlist_admin.emails.newEntry.dismiss" satisfies WaitlistAdminAllKeys,
              ),
              url: dismissUrl,
              backgroundColor: EMAIL_BRAND.destructive,
            },
          },
        ],
      },
      layoutArgs,
    );

    notifications.push({
      email: {
        to: recipient.email,
        subject,
        body,
      },
      handledBy:
        "app_waitlist_admin.handlers.newWaitlistEntry" satisfies WaitlistAdminAllKeys,
      participantType: "member",
      memberId: recipient.memberId,
      customerId: entry.customer?._id,
    });
  }

  return notifications.length ? notifications : null;
};
