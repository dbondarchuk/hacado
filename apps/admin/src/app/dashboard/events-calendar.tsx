"use client";

import { cn } from "@hacado/ui";
import {
  EventCalendarView,
  EventsCalendar as KitEventsCalendar,
} from "@hacado/ui-admin-kit";
import { DateTime } from "luxon";
import React from "react";
import { useCookies } from "react-cookie";

type DashboardEventsCalendarView = Exclude<EventCalendarView, "days-around">;

const VIEW_COOKIE_NAME = "events-calendar-view";

type CookieValues = {
  [VIEW_COOKIE_NAME]?: DashboardEventsCalendarView;
};

export const EventsCalendar = ({
  className,
  memberId,
}: {
  className?: string;
  memberId?: string;
}) => {
  const [cookies, setCookies] = useCookies<
    typeof VIEW_COOKIE_NAME,
    CookieValues
  >([VIEW_COOKIE_NAME]);

  const [date, setDate] = React.useState(
    DateTime.now().startOf("day") as DateTime,
  );

  const [view, setView] = React.useState<DashboardEventsCalendarView>(
    cookies[VIEW_COOKIE_NAME] ?? "weekly",
  );

  const changeView = (next: EventCalendarView) => {
    if (next === "days-around") return;
    setView(next);
    setCookies(VIEW_COOKIE_NAME, next, {
      expires: DateTime.now().plus({ years: 1 }).toJSDate(),
    });
  };

  return (
    <KitEventsCalendar
      className={cn(
        "w-full",
        view !== "monthly" && view !== "agenda" && "h-[min(100vh,720px)]",
        className,
      )}
      date={date.toJSDate()}
      onDateChange={(next) => setDate(DateTime.fromJSDate(next).startOf("day"))}
      view={view}
      onViewChange={changeView}
      memberId={memberId}
      showControls
      allowTimeChange
      allowViewSwitch
      onDateClick={(clicked) => {
        setDate(DateTime.fromJSDate(clicked).startOf("day"));
        changeView("daily");
      }}
    />
  );
};
