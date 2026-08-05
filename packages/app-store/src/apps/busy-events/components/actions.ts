import { adminApi } from "@hacado/api-sdk";
import { Schedule, WeekIdentifier } from "@hacado/types";
import { RequestAction } from "../models";

export const getWeeklyEvents = async (
  appId: string,
  weekIdentifier: WeekIdentifier,
  memberId?: string,
) => {
  return (await adminApi.apps.processRequest(appId, {
    type: "get-weekly-busy-events",
    week: weekIdentifier,
    memberId,
  } as RequestAction)) as Schedule;
};

export const setEvents = async (
  appId: string,
  week: WeekIdentifier,
  events: Schedule,
  memberId?: string,
) => {
  await adminApi.apps.processRequest(appId, {
    type: "set-busy-events",
    events,
    week,
    memberId,
  } as RequestAction);
};
