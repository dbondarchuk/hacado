import type { I18nFn } from "@hacado/i18n";

const MINUTES_PER_WEEK = 7 * 24 * 60;
const MINUTES_PER_DAY = 24 * 60;

function toWeeksDaysHoursMinutes(totalMinutes: number) {
  let m = Math.max(0, Math.floor(totalMinutes));
  const weeks = Math.floor(m / MINUTES_PER_WEEK);
  m %= MINUTES_PER_WEEK;
  const days = Math.floor(m / MINUTES_PER_DAY);
  m %= MINUTES_PER_DAY;
  const hours = Math.floor(m / 60);
  const minutes = m % 60;
  return { weeks, days, hours, minutes };
}

export function formatTimeBeforeAppointmentRuleHeader(
  totalMinutes: number | null | undefined,
  t: I18nFn<"admin">,
  listLocale: string,
) {
  const safeMinutes =
    totalMinutes == null || Number.isNaN(totalMinutes)
      ? 0
      : Math.max(0, totalMinutes);
  const { weeks, days, hours, minutes } = toWeeksDaysHoursMinutes(safeMinutes);

  const parts: string[] = [];
  if (weeks > 0) {
    parts.push(
      t("cancellationsAndReschedules.timeBeforeAppointment.week", {
        count: weeks,
      }),
    );
  }
  if (days > 0) {
    parts.push(
      t("cancellationsAndReschedules.timeBeforeAppointment.day", {
        count: days,
      }),
    );
  }
  if (hours > 0) {
    parts.push(
      t("cancellationsAndReschedules.timeBeforeAppointment.hour", {
        count: hours,
      }),
    );
  }
  if (minutes > 0) {
    parts.push(
      t("cancellationsAndReschedules.timeBeforeAppointment.minute", {
        count: minutes,
      }),
    );
  }
  if (parts.length === 0) {
    parts.push(
      t("cancellationsAndReschedules.timeBeforeAppointment.minute", {
        count: 0,
      }),
    );
  }

  const duration = new Intl.ListFormat(listLocale, {
    style: "long",
    type: "conjunction",
  }).format(parts);

  return t("cancellationsAndReschedules.timeBeforeAppointment.header", {
    duration,
  });
}
