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

function parseInitialDate(value?: string): DateTime {
  if (!value) {
    return DateTime.now().startOf("day");
  }

  const parsed = DateTime.fromISO(value);
  if (!parsed.isValid) {
    return DateTime.now().startOf("day");
  }

  return parsed.startOf("day");
}

export const EventsCalendar = ({
  className,
  memberId,
  initialDate,
  controlsAfterViewSwitch,
}: {
  className?: string;
  memberId?: string;
  initialDate?: string;
  controlsAfterViewSwitch?: React.ReactNode;
}) => {
  const [cookies, setCookies] = useCookies<
    typeof VIEW_COOKIE_NAME,
    CookieValues
  >([VIEW_COOKIE_NAME]);

  const [date, setDate] = React.useState(() => parseInitialDate(initialDate));

  const [view, setView] = React.useState<DashboardEventsCalendarView>(
    cookies[VIEW_COOKIE_NAME] ?? "weekly",
  );

  React.useEffect(() => {
    setDate(parseInitialDate(initialDate));
  }, [initialDate]);

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
      scrollToEarliestEvent
      controlsAfterViewSwitch={controlsAfterViewSwitch}
      onDateClick={(clicked) => {
        setDate(DateTime.fromJSDate(clicked).startOf("day"));
        changeView("daily");
      }}
    />
  );
};
