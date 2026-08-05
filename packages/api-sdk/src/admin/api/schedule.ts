import { DaySchedule } from "@hacado/types";
import {
  ScheduleSearchParams,
  serializeScheduleSearchParams,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getSchedule = async (searchParams: ScheduleSearchParams) => {
  console.debug("Getting schedule", {
    searchParams,
  });

  const serializedSearchParams = serializeScheduleSearchParams(searchParams);
  const response = await fetchAdminApi(`/schedule${serializedSearchParams}`, {
    method: "GET",
  });

  const data = await response.json<Record<string, DaySchedule>>();
  console.debug("Schedule retrieved successfully", {
    data,
  });

  return data;
};
