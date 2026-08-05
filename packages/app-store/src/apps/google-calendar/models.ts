import {
  ConnectedOauthAppTokens,
  zNonEmptyString,
  zTaggedUnion,
} from "@hacado/types";
import * as z from "zod";

export const googleCalendarConfigurationSchema = z.object({
  calendar: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});

export type GoogleCalendarConfiguration = ConnectedOauthAppTokens &
  z.infer<typeof googleCalendarConfigurationSchema>;

export const calendarListItemSchema = z.object({
  id: zNonEmptyString(),
  name: zNonEmptyString(),
});

export type CalendarListItem = z.infer<typeof calendarListItemSchema>;

export const GetCalendarListRequestType = "get-calendar-list" as const;
export const GetSelectedCalendarRequestType = "get-selected-calendar" as const;

export const setCalendarRequestSchema = z.object({
  calendar: calendarListItemSchema,
});

export type SetCalendarRequest = z.infer<typeof setCalendarRequestSchema>;
export const SetCalendarRequestType = "set-calendar" as const;

export const requestActionSchema = zTaggedUnion([
  { type: GetSelectedCalendarRequestType },
  { type: GetCalendarListRequestType },
  { type: SetCalendarRequestType, data: setCalendarRequestSchema },
]);

export type RequestAction = z.infer<typeof requestActionSchema>;
