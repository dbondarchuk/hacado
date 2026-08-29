import { type Language } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import { durationToTime } from "@hacado/utils";
import { DateTime } from "luxon";
import { WaitlistEntry, waitlistTime } from "../waitlist/models/waitlist";
import { getSlotTimeOfDayArgs } from "./slot-match";
import { customerWaitlistNotificationsPublicNamespace } from "./translations/types";

export const getWaitlistEntryArgs = (entry: WaitlistEntry) => {
  return {
    ...entry,
    duration: entry.duration ? durationToTime(entry.duration) : undefined,
    dates:
      entry.dates?.map((date) => ({
        date: DateTime.fromISO(date.date).toJSDate(),
        time: date.time || [],
        isMorning: date.time?.includes("morning"),
        isAfternoon: date.time?.includes("afternoon"),
        isEvening: date.time?.includes("evening"),
        isAllDay: waitlistTime.every((time) =>
          date.time?.some((t) => t === time),
        ),
      })) || [],
  };
};

export async function loadSlotTimeOfDayArgs(
  slotStart: Date,
  timeZone: string,
  locale: Language,
) {
  const t = await getI18nAsync({
    locale,
    namespace: customerWaitlistNotificationsPublicNamespace,
  });
  return getSlotTimeOfDayArgs(slotStart, timeZone, {
    morning: t("slotTimeOfDay.morning"),
    afternoon: t("slotTimeOfDay.afternoon"),
    evening: t("slotTimeOfDay.evening"),
  });
}
