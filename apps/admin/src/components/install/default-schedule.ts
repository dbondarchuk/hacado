import type {
  Schedule,
  ScheduleConfiguration,
} from "@hacado/types/configuration/schedule";
import { scheduleConfigurationSchema } from "@hacado/types/configuration/schedule";

/** Mon–Fri 09:00–17:00, weekends closed (Luxon weekdays: 1 = Monday … 7 = Sunday). */
export function getDefaultInstallSchedule(): Schedule {
  return getDefaultScheduleConfiguration().schedule;
}

/** Mon–Fri 09:00–17:00, weekends closed (Luxon weekdays: 1 = Monday … 7 = Sunday). */
export function getDefaultScheduleConfiguration(): ScheduleConfiguration {
  const workShift = { start: "09:00", end: "17:00" };
  return scheduleConfigurationSchema.parse({
    schedule: [
      { weekDay: 1, shifts: [workShift] },
      { weekDay: 2, shifts: [workShift] },
      { weekDay: 3, shifts: [workShift] },
      { weekDay: 4, shifts: [workShift] },
      { weekDay: 5, shifts: [workShift] },
      { weekDay: 6, shifts: [] },
      { weekDay: 7, shifts: [] },
    ],
  });
}
