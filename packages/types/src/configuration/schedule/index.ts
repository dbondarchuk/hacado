import * as z from "zod";
import { shiftsSchema } from "./shifts";

export * from "./exception";
export * from "./override";
export * from "./shifts";

export const scheduleConfigurationSchema = z.object({
  schedule: shiftsSchema,
});

export type Schedule = z.infer<typeof shiftsSchema>;
export type DaySchedule = Schedule[0]["shifts"];

export type ScheduleConfiguration = z.infer<typeof scheduleConfigurationSchema>;
