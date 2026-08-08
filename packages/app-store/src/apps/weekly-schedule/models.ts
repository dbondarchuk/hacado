import {
  shiftsSchema,
  weekIdentifierSchema,
  zTaggedUnion,
} from "@hacado/types";
import * as z from "zod";

export const setSchedulesActionSchema = z.object({
  schedules: z.record(weekIdentifierSchema, shiftsSchema),
  replaceExisting: z.coerce.boolean<boolean>().optional(),
  memberId: z.string().optional(),
});

export type SetSchedulesAction = z.infer<typeof setSchedulesActionSchema>;
export const SetSchedulesActionType = "set-schedules" as const;

export const removeScheduleActionSchema = z.object({
  week: weekIdentifierSchema,
  memberId: z.string().optional(),
});

export type RemoveScheduleAction = z.infer<typeof removeScheduleActionSchema>;
export const RemoveScheduleActionType = "remove-schedule" as const;

export const removeAllSchedulesActionSchema = z.object({
  week: weekIdentifierSchema,
  memberId: z.string().optional(),
});

export type RemoveAllSchedulesAction = z.infer<
  typeof removeAllSchedulesActionSchema
>;
export const RemoveAllSchedulesActionType = "remove-all-schedules" as const;

export const setCompanyHolidaysActionSchema = z.object({
  week: weekIdentifierSchema,
  /** Luxon weekdays 1–7 marked as company holidays for this week. */
  holidays: z.array(z.coerce.number<number>().int().min(1).max(7)),
});

export type SetCompanyHolidaysAction = z.infer<
  typeof setCompanyHolidaysActionSchema
>;
export const SetCompanyHolidaysActionType = "set-company-holidays" as const;

export const getWeeklyScheduleRequestSchema = z.object({
  week: weekIdentifierSchema,
  memberId: z.string().optional(),
});

export type GetWeeklyScheduleRequest = z.infer<
  typeof getWeeklyScheduleRequestSchema
>;
export const GetWeeklyScheduleRequestType = "get-weekly-schedule" as const;

export const repeatScheduleActionSchema = z.object({
  week: weekIdentifierSchema,
  interval: z.coerce.number<number>().int().min(1),
  maxWeek: weekIdentifierSchema,
  replaceExisting: z.coerce.boolean<boolean>().optional(),
  memberId: z.string().optional(),
});

export type RepeatScheduleAction = z.infer<typeof repeatScheduleActionSchema>;
export const RepeatScheduleActionType = "repeat-schedule" as const;

export const removeRecurringScheduleActionSchema = z.object({
  exceptionId: z.string().min(1),
  memberId: z.string().optional(),
});

export type RemoveRecurringScheduleAction = z.infer<
  typeof removeRecurringScheduleActionSchema
>;
export const RemoveRecurringScheduleActionType =
  "remove-recurring-schedule" as const;

export const requestActionSchema = zTaggedUnion([
  { type: SetSchedulesActionType, data: setSchedulesActionSchema },
  { type: RemoveScheduleActionType, data: removeScheduleActionSchema },
  { type: RemoveAllSchedulesActionType, data: removeAllSchedulesActionSchema },
  { type: SetCompanyHolidaysActionType, data: setCompanyHolidaysActionSchema },
  { type: GetWeeklyScheduleRequestType, data: getWeeklyScheduleRequestSchema },
  { type: RepeatScheduleActionType, data: repeatScheduleActionSchema },
  {
    type: RemoveRecurringScheduleActionType,
    data: removeRecurringScheduleActionSchema,
  },
]);

export type RequestAction = z.infer<typeof requestActionSchema>;
