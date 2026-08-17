import * as z from "zod";
import { shiftsSchema } from "./shifts";

export const scheduleExceptionScopeSchema = z.enum(["company", "member"]);

export type ScheduleExceptionScope = z.infer<
  typeof scheduleExceptionScopeSchema
>;

/** Luxon weekday 1 (Mon) – 7 (Sun). */
export type ScheduleWeekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type DaySchedule = z.infer<typeof shiftsSchema>[number]["shifts"];

/**
 * Sparse schedule exception. Missing weekdays inherit from the next layer.
 * An explicit empty array means no hours at this layer (members may still override
 * unless the weekday is listed in `holidays`).
 */
export const scheduleExceptionDaysSchema = z.record(
  z.coerce.number<number>().int().min(1).max(7),
  z.array(
    z.object({
      start: z.string(),
      end: z.string(),
    }),
  ),
);

export const scheduleExceptionHolidaysSchema = z.array(
  z.coerce.number<number>().int().min(1).max(7),
);

export const scheduleExceptionSchema = z.object({
  scope: scheduleExceptionScopeSchema,
  memberId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: scheduleExceptionDaysSchema,
  /**
   * Company-only hard closures (holidays). Members cannot reopen these days.
   * Distinct from empty `days` entries, which are reduced/no company hours.
   */
  holidays: scheduleExceptionHolidaysSchema.optional(),
  /** When set (>= 1) with repeatUntil, expands the template week on that interval. */
  repeatEveryWeeks: z.coerce.number<number>().int().min(1).optional(),
  /** Inclusive YYYY-MM-DD (Sunday of last occurrence). */
  repeatUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  /** Week identifiers punched out of a recurrence (week-local reset). */
  excludeWeeks: z.array(z.coerce.number<number>().int()).optional(),
  /** ISO timestamp; newer recurrings win when multiple cover a date. */
  createdAt: z.string().optional(),
});

export type ScheduleException = {
  scope: ScheduleExceptionScope;
  memberId?: string;
  startDate: string;
  endDate: string;
  days: Partial<Record<ScheduleWeekDay, DaySchedule>>;
  /** Company hard closures - see schema comment. */
  holidays?: ScheduleWeekDay[];
  repeatEveryWeeks?: number;
  repeatUntil?: string;
  excludeWeeks?: number[];
  createdAt?: string;
};

/** Metadata returned when a week is covered by a recurring exception. */
export type ScheduleRecurrenceInfo = {
  id: string;
  everyWeeks: number;
  until: string;
  /** True when a single-week override sits on top of the series. */
  isWeekOverride: boolean;
};

export type ScheduleExceptionEntity = ScheduleException & {
  _id: string;
  organizationId: string;
  /** Optional link to the weekly-schedule app install that manages this exception. */
  appId?: string;
};

/** Source layer that produced a day's effective hours. */
export type ScheduleDaySource =
  | "company"
  | "member"
  | "app"
  | "default"
  | "holiday";

export type ResolveDayScheduleInput = {
  /** YYYY-MM-DD */
  date: string;
  /** Luxon weekday 1–7 */
  weekDay: ScheduleWeekDay;
  defaultShifts: DaySchedule | undefined;
  companyExceptions: ScheduleException[];
  memberExceptions: ScheduleException[];
  /** Optional day from an external schedule provider (e.g. URL). */
  appDay?: DaySchedule;
};

export type ResolveDayScheduleResult = {
  shifts: DaySchedule;
  source: ScheduleDaySource;
};
