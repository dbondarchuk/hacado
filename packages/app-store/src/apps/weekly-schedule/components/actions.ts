import { adminApi } from "@timelish/api-sdk";
import { Schedule, WeekIdentifier } from "@timelish/types";
import { getWeekIdentifier } from "@timelish/utils";
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
};

export const repeatWeeklySchedule = async (
  appId: string,
  week: WeekIdentifier,
  interval: number,
  maxWeek: WeekIdentifier,
  replaceExisting?: boolean,
  memberId?: string,
) => {
  const fromSchedule = await getWeeklySchedule(appId, week, memberId);
  if (fromSchedule.isDefault)
    throw new Error(`Week ${week} does not have custom schedule`);

  const todayWeek = getWeekIdentifier(new Date());
  const weeks: Record<WeekIdentifier, Schedule> = {};
  for (let w = week; w <= maxWeek; w += interval) {
    if (w < todayWeek) continue;

    weeks[w] = fromSchedule.schedule;
  }

  await adminApi.apps.processRequest(appId, {
    type: "set-schedules",
    schedules: weeks,
    replaceExisting,
    memberId,
  } as RequestAction);
};
