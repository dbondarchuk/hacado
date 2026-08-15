import { WeekIdentifier } from "@hacado/types";
import { getDateFromWeekIdentifier } from "@hacado/utils";
import { DateTime } from "luxon";

export const getWeekDisplay = (week: WeekIdentifier) => {
  const date = getDateFromWeekIdentifier(week);

  const weekStart = DateTime.fromJSDate(date).startOf("week");
  const weekEnd = weekStart.endOf("week");

  // Format the date range
  return `${weekStart.toFormat("MMM d")} - ${weekEnd.toFormat("MMM d, yyyy")}`;
};
