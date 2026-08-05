import { CalendarEvent, DaySchedule } from "@hacado/types";
import {
  CalendarSearchParams,
  serializeCalendarSearchParams,
} from "../search-params";
import { fetchAdminApi } from "./utils";

export const getCalendar = async (searchParams: CalendarSearchParams) => {
  console.debug("Getting calendar", {
    searchParams,
  });

  const serializedSearchParams = serializeCalendarSearchParams(searchParams);
  const result = await fetchAdminApi(`/calendar${serializedSearchParams}`);

  const data = await result.json<{
    events: CalendarEvent[];
    schedule: Record<string, DaySchedule>;
  }>();

  console.debug("Calendar retrieved successfully", {
    eventsCount: data.events.length,
    scheduleCount: data.schedule.length,
  });

  return data;
};
