import { adminApi } from "@hacado/api-sdk";
import {
  Schedule,
  ScheduleDaySource,
  ScheduleRecurrenceInfo,
  ScheduleWeekDay,
  WeekIdentifier,
} from "@hacado/types";
import { RequestAction } from "../models";

export const getWeeklySchedule = async (
  appId: string,
  weekIdentifier: WeekIdentifier,
  memberId?: string,
) => {
  return (await adminApi.apps.processRequest(appId, {
    type: "get-weekly-schedule",
    week: weekIdentifier,
    memberId,
  } as RequestAction)) as {
    schedule: Schedule;
    isDefault: boolean;
    daySources?: Record<number, ScheduleDaySource>;
    holidays?: ScheduleWeekDay[];
    recurrence?: ScheduleRecurrenceInfo | null;
  };
};

export const updateWeeklySchedule = async (
  appId: string,
  weekIdentifier: WeekIdentifier,
  schedule: Schedule,
  memberId?: string,
) => {
  await adminApi.apps.processRequest(appId, {
    type: "set-schedules",
    schedules: {
      [weekIdentifier]: schedule,
    },
    replaceExisting: true,
    memberId,
  } as RequestAction);
};

export const setCompanyHolidays = async (
  appId: string,
  weekIdentifier: WeekIdentifier,
  holidays: ScheduleWeekDay[],
) => {
  await adminApi.apps.processRequest(appId, {
    type: "set-company-holidays",
    week: weekIdentifier,
    holidays,
  } as RequestAction);
};

export const resetWeeklySchedule = async (
  appId: string,
  week: WeekIdentifier,
  memberId?: string,
) => {
  await adminApi.apps.processRequest(appId, {
    type: "remove-schedule",
    week,
    memberId,
  } as RequestAction);
};

export const resetAllWeeklySchedule = async (
  appId: string,
  week: WeekIdentifier,
  memberId?: string,
) => {
  await adminApi.apps.processRequest(appId, {
    type: "remove-all-schedules",
    week,
    memberId,
  } as RequestAction);
};

export const removeRecurringWeeklySchedule = async (
  appId: string,
  exceptionId: string,
  memberId?: string,
) => {
  await adminApi.apps.processRequest(appId, {
    type: "remove-recurring-schedule",
    exceptionId,
    memberId,
  } as RequestAction);
};

export const copyWeeklySchedule = async (
  appId: string,
  fromWeek: WeekIdentifier,
  toWeek: WeekIdentifier,
  memberId?: string,
) => {
  const fromSchedule = await getWeeklySchedule(appId, fromWeek, memberId);
  if (fromSchedule.isDefault)
    throw new Error(`Week ${fromWeek} does not have custom schedule`);

  await adminApi.apps.processRequest(appId, {
    type: "set-schedules",
    schedules: {
      [toWeek]: fromSchedule.schedule,
    },
    replaceExisting: true,
    memberId,
  } as RequestAction);

  if (!memberId) {
    await setCompanyHolidays(appId, toWeek, fromSchedule.holidays ?? []);
  }
};

export const repeatWeeklySchedule = async (
  appId: string,
  week: WeekIdentifier,
  interval: number,
  maxWeek: WeekIdentifier,
  replaceExisting?: boolean,
  memberId?: string,
) => {
  await adminApi.apps.processRequest(appId, {
    type: "repeat-schedule",
    week,
    interval,
    maxWeek,
    replaceExisting,
    memberId,
  } as RequestAction);
};
