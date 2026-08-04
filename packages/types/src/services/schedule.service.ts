import { DaySchedule } from "../configuration/schedule";

export interface IScheduleService {
  getSchedule(
    start: Date,
    end: Date,
    memberId: string,
  ): Promise<Record<string, DaySchedule>>;
}
