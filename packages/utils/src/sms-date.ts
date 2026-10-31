import { DateTime } from "luxon";

const SMS_DATETIME = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
} as const;

export function formatSmsDate(
  dateTime: DateTime,
  locale: string,
  now: DateTime = DateTime.now(),
) {
  const reference = now.setZone(dateTime.zone);

  return {
    sms: dateTime.setLocale(locale).toLocaleString(SMS_DATETIME),
    isTomorrow: dateTime.hasSame(reference.plus({ days: 1 }), "day"),
  };
}
