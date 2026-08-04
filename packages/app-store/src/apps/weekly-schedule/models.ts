import {
  shiftsSchema,
  weekIdentifierSchema,
  zTaggedUnion,
} from "@timelish/types";
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

export const getWeeklyScheduleRequestSchema = z.object({
  week: weekIdentifierSchema,
  memberId: z.string().optional(),
});

export type GetWeeklyScheduleRequest = z.infer<
  typeof getWeeklyScheduleRequestSchema
>;
export const GetWeeklyScheduleRequestType = "get-weekly-schedule" as const;

export const requestActionSchema = zTaggedUnion([
  { type: SetSchedulesActionType, data: setSchedulesActionSchema },
  { type: RemoveScheduleActionType, data: removeScheduleActionSchema },
  { type: RemoveAllSchedulesActionType, data: removeAllSchedulesActionSchema },
  { type: GetWeeklyScheduleRequestType, data: getWeeklyScheduleRequestSchema },
]);

export type RequestAction = z.infer<typeof requestActionSchema>;
