import {
  shiftsSchema,
  weekIdentifierSchema,
  zTaggedUnion,
} from "@timelish/types";
import * as z from "zod";

// SetBusyEventsAction

export const setBusyEventsActionSchema = z.object({
  events: shiftsSchema,
  week: weekIdentifierSchema,
  memberId: z.string().optional(),
});

export type SetBusyEventsAction = z.infer<typeof setBusyEventsActionSchema>;
export const SetBusyEventsActionType = "set-busy-events" as const;

// GetWeeklyBusyEventsRequest

export const getWeeklyBusyEventsRequestSchema = z.object({
  week: weekIdentifierSchema,
  memberId: z.string().optional(),
});

export type GetWeeklyBusyEventsRequest = z.infer<
  typeof getWeeklyBusyEventsRequestSchema
>;
export const GetWeeklyBusyEventsRequestType = "get-weekly-busy-events" as const;

export const DefaultRequestType = "default" as const;

export const requestActionSchema = zTaggedUnion([
  { type: SetBusyEventsActionType, data: setBusyEventsActionSchema },
  {
    type: GetWeeklyBusyEventsRequestType,
    data: getWeeklyBusyEventsRequestSchema,
  },
  {
    type: DefaultRequestType,
  },
]);

export type RequestAction = z.infer<typeof requestActionSchema>;
