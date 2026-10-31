import { appsApi } from "@hacado/api-sdk/admin/apps";
import { Schedule } from "@hacado/types/configuration/schedule";
import { WeekIdentifier } from "@hacado/types/general";
import { RequestAction } from "../models";

export const getWeeklyEvents = async (
  appId: string,
  weekIdentifier: WeekIdentifier,
) => {
  return (await appsApi.processRequest(appId, {
    type: "get-weekly-busy-events",
    week: weekIdentifier,
  } as RequestAction)) as Schedule;
};

export const setEvents = async (
  appId: string,
  week: WeekIdentifier,
  events: Schedule,
) => {
  await appsApi.processRequest(appId, {
    type: "set-busy-events",
    events,
    week,
  } as RequestAction);
};
