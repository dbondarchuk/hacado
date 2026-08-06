"use client";

import { adminApi } from "@hacado/api-sdk";
import { Appointment, CalendarEvent, DaySchedule } from "@hacado/types";
import { cn } from "@hacado/ui";
import { getColorForName } from "@hacado/utils";
import { DateTime, HourNumbers } from "luxon";
import React from "react";
import { EventCalendar, EventCalendarEvent } from "../event-calendar";

export const AppointmentCalendar: React.FC<{
  className?: string;
  appointment: Appointment;
  onEventsLoad?: (events: CalendarEvent[]) => void;
}> = ({ appointment, onEventsLoad, className }) => {
  const [apiEvents, setApiEvents] = React.useState<CalendarEvent[]>([]);
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [schedule, setSchedule] = React.useState<Record<string, DaySchedule>>(
    {},
  );
  const [loading, setLoading] = React.useState(false);

  const appointmentDateTime = appointment.dateTime;
  const appointmentDate = React.useMemo(
    () => DateTime.fromJSDate(appointment.dateTime).toISODate(),
    [appointmentDateTime],
  );

  const getData = async (start: DateTime, end: DateTime) => {
    if (!appointment.memberId) {
      setApiEvents([]);
      setSchedule({});
      return;
    }

    setLoading(true);

    const result = await adminApi.calendar.getCalendar({
      start: start.startOf("day").toJSDate(),
      end: end.endOf("day").toJSDate(),
      member: appointment.memberId,
    });

    const nextApiEvents = result.events || [];

    setLoading(false);
    setApiEvents(nextApiEvents);
    setSchedule(result.schedule);
  };

  React.useEffect(() => {
    const apiEventsWithoutCurrent = apiEvents.filter(
      (a) => (a as Appointment)._id !== appointment._id,
    );

    setEvents([...apiEventsWithoutCurrent, appointment]);

    onEventsLoad?.(apiEvents);
  }, [apiEvents, appointment, onEventsLoad, setEvents]);

  React.useEffect(() => {
    const date = DateTime.fromJSDate(appointmentDateTime);
    getData(
      date.minus({ days: 1 }).startOf("day"),
      date.plus({ days: 1 }).endOf("day"),
    );
  }, [appointmentDate, appointment.memberId]);

  const calendarEvents: EventCalendarEvent[] = React.useMemo(
    () =>
      events.map((app) => {
        const start = DateTime.fromJSDate(app.dateTime);
        if ("_id" in app) {
          const memberName = app.member?.name || app.member?.email || "";
          const statusVariant =
            app.status === "declined"
              ? "destructive"
              : app.status === "pending"
                ? "secondary"
                : "primary";
          return {
            start: start.toJSDate(),
            end: start.plus({ minutes: app.totalDuration || 0 }).toJSDate(),
            id: app._id,
            title: app.option.name,
            customerName: app.fields.name,
            member: app.member
              ? {
                  _id: app.member._id,
                  name: app.member.name,
                  email: app.member.email,
                  image: app.member.image,
                }
              : undefined,
            color: memberName ? getColorForName(memberName) : undefined,
            variant:
              app._id === appointment._id && app.status !== "declined"
                ? "current"
                : statusVariant,
          };
        } else {
          return {
            start: start.toJSDate(),
            end: start.plus({ minutes: app.totalDuration || 0 }).toJSDate(),
            title: app.title,
            variant: "tertiary",
            member: app.member
              ? {
                  _id: app.member._id,
                  name: app.member.name,
                  email: app.member.email,
                  image: app.member.image,
                }
              : undefined,
          };
        }
      }),
    [events, appointment._id],
  );

  return (
    <EventCalendar
      className={cn("min-w-[200px] h-[60vh]", className)}
      date={appointment.dateTime}
      events={calendarEvents}
      schedule={schedule}
      view="days-around"
      daysAround={1}
      scrollToHour={
        Math.max(appointment.dateTime.getHours() - 2, 0) as HourNumbers
      }
      showControls
      allowTimeChange={false}
      allowViewSwitch={false}
      loading={loading}
      onRangeChange={(start, end) => {
        getData(DateTime.fromJSDate(start), DateTime.fromJSDate(end));
      }}
    />
  );
};
