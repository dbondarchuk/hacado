import type {
  Schedule,
  ScheduleException,
  ScheduleExceptionScope,
  ScheduleWeekDay,
  WeekIdentifier,
} from "@hacado/types";
import { DateTime } from "luxon";
import { getDateFromWeekIdentifier } from "./time";

/** App-owned collection for weekly-schedule exceptions (not used by core ScheduleService). */
export const WEEKLY_SCHEDULE_EXCEPTIONS_COLLECTION_NAME =
  "weekly-schedule-exceptions";

export function weekToDateRange(week: WeekIdentifier): {
  startDate: string;
  endDate: string;
} {
  const monday = DateTime.fromJSDate(getDateFromWeekIdentifier(week), {
    zone: "utc",
  }).startOf("day");
  const sunday = monday.plus({ days: 6 });
  return {
    startDate: monday.toISODate()!,
    endDate: sunday.toISODate()!,
  };
}

export function scheduleToExceptionDays(
  schedule: Schedule,
): ScheduleException["days"] {
  const days: ScheduleException["days"] = {};
  for (const day of schedule) {
    days[day.weekDay as ScheduleWeekDay] = day.shifts;
  }
  return days;
}

export function exceptionDaysToSchedule(
  days: ScheduleException["days"],
): Schedule {
  return (Object.entries(days) as [string, Schedule[number]["shifts"]][])
    .map(([weekDay, shifts]) => ({
      weekDay: Number(weekDay),
      shifts,
    }))
    .sort((a, b) => a.weekDay - b.weekDay);
}

export function buildWeekException(args: {
  week: WeekIdentifier;
  schedule: Schedule;
  scope: ScheduleExceptionScope;
  memberId?: string;
}): ScheduleException {
  const { startDate, endDate } = weekToDateRange(args.week);
  return {
    scope: args.scope,
    memberId: args.scope === "member" ? args.memberId : undefined,
    startDate,
    endDate,
    days: scheduleToExceptionDays(args.schedule),
  };
}
