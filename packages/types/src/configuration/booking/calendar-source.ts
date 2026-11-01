import * as z from "zod";
import { zNonEmptyString } from "../../utils";

export const calendarSourceConfigurationSchema = z.object({
  appId: zNonEmptyString("configuration.booking.calendarSource.required"),
});

export type CalendarSourceConfiguration = z.infer<
  typeof calendarSourceConfigurationSchema
>;

export const calendarSourcesConfigurationSchema = z
  .array(calendarSourceConfigurationSchema)
  .optional();

export type CalendarSourcesConfiguration = z.infer<
  typeof calendarSourcesConfigurationSchema
>;
