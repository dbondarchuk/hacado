import {
  Time,
  parseTime as typesParseTime,
  WeekIdentifier,
} from "@hacado/types";
import { DateTime, DateTimeUnit, Duration, Interval } from "luxon";

const REFERENCE_DATE = DateTime.fromObject({ year: 1970, month: 1, day: 5 }); // January 5, 1970 (Monday)

export function getWeekIdentifier(date: Date | DateTime): WeekIdentifier {
  // const epoch = date instanceof Date ? date.getTime() : date.toMillis();
  const d = date instanceof Date ? DateTime.fromJSDate(date) : date;
  const diff = Math.floor(d.diff(REFERENCE_DATE, "weeks").weeks);

  return diff;

  // const timeDiff = epoch - REFERENCE_DATE.toMillis();

  // // Compute the number of weeks since the reference date
  // return Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000)) + 1;
}

export function getDateFromWeekIdentifier(identifier: WeekIdentifier): Date {
  return REFERENCE_DATE.plus({ weeks: identifier }).toJSDate();
  // // Calculate the date corresponding to the given week identifier
  // return new Date(
  //   REFERENCE_DATE.toMillis() + (identifier - 1) * 7 * 24 * 60 * 60 * 1000
  // );
}

export const parseTime = typesParseTime;

export const formatTime = (time: Time) =>
  `${time.hour.toString().padStart(2, "0")}:${time.minute
    .toString()
    .padStart(2, "0")}`;

export const formatTimeLocale = (
  time: Time | Date | DateTime,
  locale?: string,
) => {
  const dateTime =
    time instanceof Date
      ? DateTime.fromJSDate(time)
      : time instanceof DateTime
        ? time
        : DateTime.fromObject(time);

  return dateTime.toLocaleString(DateTime.TIME_SIMPLE, { locale });
};

export const durationToTime = (minutes: number) => {
  const duration = Duration.fromObject({ minutes }).shiftTo("hours", "minutes");
  return {
    hours: duration.hours,
    minutes: duration.minutes,
  };
};

export const timeToDuration = (
  time?: { hours: number; minutes: number } | null,
) => {
  if (!time) return undefined;
  return time.hours * 60 + time.minutes;
};

export const weeks = {
  durationToTime: (minutes: number) => {
    const duration = Duration.fromObject({ minutes }).shiftTo(
      "weeks",
      "days",
      "hours",
      "minutes",
    );
    return {
      weeks: duration.weeks,
      days: duration.days,
      hours: duration.hours,
      minutes: duration.minutes,
    };
  },
  timeToDuration: (
    time: {
      weeks: number;
      days: number;
      hours: number;
      minutes: number;
    } | null,
  ) => {
    if (!time) return undefined;
    return (
      time.weeks * 7 * 24 * 60 +
      time.days * 24 * 60 +
      time.hours * 60 +
      time.minutes
    );
  },
};

export const areTimesEqual = (
  timeA: Time | undefined | null,
  timeB: Time | undefined | null,
) => timeA?.hour === timeB?.hour && timeA?.minute === timeB?.minute;

export const is12hourUserTimeFormat = (locale?: string) => {
  const format = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
  }).resolvedOptions().hourCycle;
  return format?.startsWith("h12") ?? false;
};

export const hasSame = (
  date1: DateTime | Date,
  date2: DateTime | Date,
  unit: DateTimeUnit,
) => {
  const dateTime1 = date1 instanceof Date ? DateTime.fromJSDate(date1) : date1;
  const dateTime2 = date2 instanceof Date ? DateTime.fromJSDate(date2) : date2;

  return +dateTime1.startOf(unit) === +dateTime2.startOf(unit);
};

export function eachOfInterval(
  start: DateTime | Date,
  end: DateTime | Date,
  unit: DateTimeUnit,
): DateTime[] {
  const startDate = start instanceof Date ? DateTime.fromJSDate(start) : start;
  const endDate = end instanceof Date ? DateTime.fromJSDate(end) : end;

  return (
    Interval.fromDateTimes(
      startDate.startOf("day"),
      endDate.endOf("day"),
    ) as Interval<true>
  )
    .splitBy({ [unit]: 1 })
    .map((d) => d.start)
    .filter((d) => !!d);
}
