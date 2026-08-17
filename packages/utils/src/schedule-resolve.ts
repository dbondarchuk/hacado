import type {
  DaySchedule,
  ResolveDayScheduleInput,
  ResolveDayScheduleResult,
  ScheduleDaySource,
  ScheduleException,
  ScheduleWeekDay,
} from "@hacado/types";
import { DateTime } from "luxon";
import { getWeekIdentifier } from "./time";

function dateSpanDays(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00.000Z`);
  const end = Date.parse(`${endDate}T00:00:00.000Z`);
  return Math.max(0, Math.round((end - start) / (24 * 60 * 60 * 1000)));
}

export function isRecurringException(exception: ScheduleException): boolean {
  return (
    typeof exception.repeatEveryWeeks === "number" &&
    exception.repeatEveryWeeks >= 1 &&
    typeof exception.repeatUntil === "string" &&
    exception.repeatUntil.length > 0
  );
}

/** Monday (YYYY-MM-DD) of the ISO week containing `date`. */
export function mondayOfDate(date: string): string {
  const day = DateTime.fromISO(date, { zone: "utc" });
  return day.minus({ days: day.weekday - 1 }).toISODate()!;
}

function weekIdentifierFromIsoDate(date: string): number {
  return getWeekIdentifier(
    DateTime.fromISO(mondayOfDate(date), { zone: "utc" }),
  );
}

/**
 * Whether a recurring exception's interval hits the week containing `date`
 * (and the date is within repeatUntil / not excluded).
 */
export function recurrenceMatchesDate(
  exception: ScheduleException,
  date: string,
): boolean {
  if (!isRecurringException(exception)) return false;
  if (date < exception.startDate) return false;
  if (date > exception.repeatUntil!) return false;

  const templateWeek = weekIdentifierFromIsoDate(exception.startDate);
  const dateWeek = weekIdentifierFromIsoDate(date);
  const offset = dateWeek - templateWeek;
  if (offset < 0) return false;
  if (offset % exception.repeatEveryWeeks! !== 0) return false;
  if ((exception.excludeWeeks ?? []).includes(dateWeek)) return false;
  return true;
}

export function exceptionCoversDate(
  exception: ScheduleException,
  date: string,
): boolean {
  if (isRecurringException(exception)) {
    return recurrenceMatchesDate(exception, date);
  }
  return exception.startDate <= date && exception.endDate >= date;
}

function compareCoveringExceptions(
  a: ScheduleException,
  b: ScheduleException,
): number {
  const aRecurring = isRecurringException(a);
  const bRecurring = isRecurringException(b);

  // Non-recurring beats recurring.
  if (aRecurring !== bRecurring) {
    return aRecurring ? 1 : -1;
  }

  if (aRecurring && bRecurring) {
    const aCreated = a.createdAt ?? "";
    const bCreated = b.createdAt ?? "";
    if (aCreated !== bCreated) {
      return bCreated.localeCompare(aCreated);
    }
  }

  return (
    dateSpanDays(a.startDate, a.endDate) - dateSpanDays(b.startDate, b.endDate)
  );
}

/**
 * Exceptions that cover `date`, ordered so the first entry wins
 * (non-recurring over recurring, then last createdAt among recurrings,
 * then narrower span).
 */
export function coveringExceptions(
  exceptions: ScheduleException[],
  date: string,
): ScheduleException[] {
  return exceptions
    .filter((exception) => exceptionCoversDate(exception, date))
    .sort(compareCoveringExceptions);
}

/**
 * Find the exception covering `date` that defines `weekDay` hours.
 * Narrower date ranges win over wider ones; see coveringExceptions.
 */
export function findExceptionDay(
  exceptions: ScheduleException[],
  date: string,
  weekDay: ScheduleWeekDay,
): DaySchedule | undefined {
  const covering = coveringExceptions(exceptions, date).filter((exception) =>
    exceptionDayHas(exception, weekDay),
  );

  if (!covering.length) return undefined;
  return getExceptionDayShifts(covering[0]!, weekDay);
}

/**
 * True when a covering company exception marks this weekday as a hard holiday.
 */
export function findExceptionHoliday(
  exceptions: ScheduleException[],
  date: string,
  weekDay: ScheduleWeekDay,
): boolean {
  const covering = coveringExceptions(exceptions, date).filter((exception) =>
    (exception.holidays ?? []).some((day) => Number(day) === weekDay),
  );
  return covering.length > 0;
}

function exceptionDayHas(
  exception: ScheduleException,
  weekDay: ScheduleWeekDay,
): boolean {
  const days = exception.days as Record<string | number, DaySchedule>;
  return (
    Object.prototype.hasOwnProperty.call(days, weekDay) ||
    Object.prototype.hasOwnProperty.call(days, String(weekDay))
  );
}

function getExceptionDayShifts(
  exception: ScheduleException,
  weekDay: ScheduleWeekDay,
): DaySchedule | undefined {
  const days = exception.days as Record<string | number, DaySchedule>;
  if (Object.prototype.hasOwnProperty.call(days, weekDay)) {
    return days[weekDay];
  }
  if (Object.prototype.hasOwnProperty.call(days, String(weekDay))) {
    return days[String(weekDay)];
  }
  return undefined;
}

/**
 * Resolve effective open hours for one calendar day.
 * Precedence: company holiday → member → company hours → app → default.
 *
 * Empty company hours are NOT holidays - members may still set their own hours.
 * Only `holidays` on a company exception lock the day closed for everyone.
 */
export function resolveDaySchedule(
  input: ResolveDayScheduleInput,
): ResolveDayScheduleResult {
  if (
    findExceptionHoliday(input.companyExceptions, input.date, input.weekDay)
  ) {
    return { shifts: [], source: "holiday" };
  }

  const memberDay = findExceptionDay(
    input.memberExceptions,
    input.date,
    input.weekDay,
  );
  if (memberDay !== undefined) {
    return { shifts: memberDay, source: "member" };
  }

  const companyDay = findExceptionDay(
    input.companyExceptions,
    input.date,
    input.weekDay,
  );
  if (companyDay !== undefined) {
    return { shifts: companyDay, source: "company" };
  }

  if (input.appDay !== undefined) {
    return { shifts: input.appDay, source: "app" };
  }

  return {
    shifts: input.defaultShifts ?? [],
    source: "default",
  };
}

export function resolveScheduleRange(args: {
  dates: { date: string; weekDay: ScheduleWeekDay }[];
  defaultByWeekDay: Partial<Record<ScheduleWeekDay, DaySchedule>>;
  companyExceptions: ScheduleException[];
  memberExceptions: ScheduleException[];
  appDays?: Record<string, DaySchedule>;
}): Record<string, { shifts: DaySchedule; source: ScheduleDaySource }> {
  const result: Record<
    string,
    { shifts: DaySchedule; source: ScheduleDaySource }
  > = {};

  for (const { date, weekDay } of args.dates) {
    result[date] = resolveDaySchedule({
      date,
      weekDay,
      defaultShifts: args.defaultByWeekDay[weekDay],
      companyExceptions: args.companyExceptions,
      memberExceptions: args.memberExceptions,
      appDay: args.appDays?.[date],
    });
  }

  return result;
}
