"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Appointment, CalendarEvent, DaySchedule } from "@hacado/types";
import { getColorForName } from "@hacado/utils";
import {
  CheckCircle,
  DollarSign,
  Presentation,
  StickyNote,
  User,
  UserCircle,
} from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { AppointmentDialog } from "../appointments/appointment-dialog";
import { EventCalendar } from "./event-calendar";
import { EventCalendarEvent, EventsCalendarProps } from "./types";

export type { EventsCalendarProps };

export const EventsCalendar: React.FC<EventsCalendarProps> = ({
  type,
  view,
  date,
  onDateChange,
  onViewChange,
  defaultView,
  showControls = true,
  allowTimeChange = true,
  allowViewSwitch = true,
  className,
  daysAround,
  daysToShow,
  scrollToHour,
  slotInterval,
  onDateClick,
  renderEvent,
  onEventClick: onEventClickProp,
  events: eventsProp,
  schedule: scheduleProp,
  onRangeChange: onRangeChangeProp,
  memberId,
  ...rest
}) => {
  const t = useI18n("admin");
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [appointment, setAppointment] = React.useState<
    Appointment | undefined
  >();

  const [schedule, setSchedule] = React.useState<Record<string, DaySchedule>>(
    {},
  );

  const [loading, setLoading] = React.useState(false);
  const managedEvents = eventsProp === undefined;
  const managedSchedule = scheduleProp === undefined;
  const rangeRef = React.useRef<{ start: Date; end: Date } | null>(null);

  const getEvents = React.useCallback(
    async (start: Date, end: Date) => {
      if (!managedEvents) {
        onRangeChangeProp?.(start, end);
        return;
      }

      rangeRef.current = { start, end };
      setLoading(true);
      setEvents([]);

      const result = await adminApi.calendar.getCalendar({
        start: DateTime.fromJSDate(start).startOf("day").toJSDate(),
        end: DateTime.fromJSDate(end).endOf("day").toJSDate(),
        member: memberId,
      });

      setLoading(false);

      if (managedSchedule) {
        setSchedule(result.schedule);
      }
      setEvents(result.events || []);
      onRangeChangeProp?.(start, end);
    },
    [managedEvents, managedSchedule, memberId, onRangeChangeProp],
  );

  React.useEffect(() => {
    if (!managedEvents || !rangeRef.current) return;
    void getEvents(rangeRef.current.start, rangeRef.current.end);
  }, [getEvents, managedEvents, memberId]);

  const calendarEvents: EventCalendarEvent[] = React.useMemo(() => {
    if (!managedEvents && eventsProp) {
      return eventsProp;
    }

    return events.map((app) => {
      const start = DateTime.fromJSDate(app.dateTime);
      if ("_id" in app) {
        const memberName = app.member?.name || app.member?.email || "";
        return {
          start: start.toJSDate(),
          end: start.plus({ minutes: app.totalDuration || 0 }).toJSDate(),
          id: app._id,
          title: app.option.name,
          customerName: app.fields.name,
          member: app.member
            ? {
                name: app.member.name,
                email: app.member.email,
                image: app.member.image,
              }
            : undefined,
          color: memberName ? getColorForName(memberName) : undefined,
          variant:
            app.status === "declined"
              ? "destructive"
              : app.status === "pending"
                ? "secondary"
                : "primary",
        };
      } else {
        return {
          start: start.toJSDate(),
          end: start.plus({ minutes: app.totalDuration || 0 }).toJSDate(),
          title: app.title,
          variant: "tertiary",
        };
      }
    });
  }, [events, eventsProp, managedEvents]);

  const onEventClick = (event: EventCalendarEvent) => {
    onEventClickProp?.(event);
    if (!event.id || !managedEvents) {
      return;
    }

    const found = events.find(
      (app) => (app as Appointment)._id == event.id,
    ) as Appointment;
    if (found) setAppointment(found);
  };

  const onDialogOpenChange = (open: boolean) => {
    if (!open) {
      setAppointment(undefined);
    }
  };

  const renderEventAgenda = React.useCallback(
    (event: EventCalendarEvent) => {
      if (renderEvent) {
        return renderEvent(event);
      }
      if (!event.id || !managedEvents) {
        return null;
      }

      const found = events.find(
        (app) => (app as Appointment)._id == event.id,
      ) as Appointment;

      if (!found) return null;

      const memberName = found.member?.name || found.member?.email;
      const customerName = found.fields?.name || found.fields?.email;

      return (
        <dl className="divide-y">
          <div className="py-1 flex flex-row gap-2 flex-wrap @sm:grid @sm:grid-cols-3 @sm:gap-4">
            <dt className="flex self-center items-center gap-1">
              <Presentation size={16} /> {t("calendar.appointment")}:
            </dt>
            <dd className="col-span-2">{found.option.name}</dd>
          </div>
          {customerName && (
            <div className="py-1 flex flex-row gap-2 flex-wrap @sm:grid @sm:grid-cols-3 @sm:gap-4">
              <dt className="flex self-center items-center gap-1">
                <User size={16} /> {t("calendar.customer")}:
              </dt>
              <dd className="col-span-2">{customerName}</dd>
            </div>
          )}
          {memberName && (
            <div className="py-1 flex flex-row gap-2 flex-wra @sm:grid @sm:grid-cols-3 @sm:gap-4">
              <dt className="flex self-center items-center gap-1">
                <UserCircle size={16} /> {t("calendar.member")}:
              </dt>
              <dd className="col-span-2">{memberName}</dd>
            </div>
          )}
          <div className="py-1 flex flex-row gap-2 flex-wrap @sm:grid @sm:grid-cols-3 @sm:gap-4">
            <dt className="flex self-center items-center gap-1">
              <CheckCircle size={16} /> {t("calendar.status")}:
            </dt>
            <dd className="col-span-2">
              {t(`appointments.status.${found.status}`)}
            </dd>
          </div>
          {found.totalPrice && (
            <div className="py-1 flex flex-row gap-2 flex-wrap @sm:grid @sm:grid-cols-3 @sm:gap-4">
              <dt className="flex self-center items-center gap-1">
                <DollarSign size={16} /> {t("calendar.price")}:
              </dt>
              <dd className="col-span-2">${found.totalPrice}</dd>
            </div>
          )}
          {found.note && (
            <div className="py-1 flex flex-row gap-2 flex-wrap @sm:py-2 @sm:grid @sm:grid-cols-3 @sm:gap-4">
              <dt className="flex self-center items-center gap-1">
                <StickyNote size={16} /> {t("calendar.note")}:
              </dt>
              <dd className="col-span-2">{found.note}</dd>
            </div>
          )}
        </dl>
      );
    },
    [events, managedEvents, renderEvent, t],
  );

  const resolvedView = view ?? type ?? defaultView ?? "weekly";

  return (
    <>
      <EventCalendar
        {...rest}
        events={calendarEvents}
        schedule={managedSchedule ? schedule : scheduleProp}
        date={date}
        onDateChange={onDateChange}
        view={resolvedView}
        defaultView={defaultView}
        onViewChange={onViewChange}
        showControls={showControls}
        allowTimeChange={allowTimeChange}
        allowViewSwitch={allowViewSwitch}
        className={className}
        loading={loading}
        daysAround={daysAround}
        daysToShow={daysToShow}
        scrollToHour={scrollToHour}
        slotInterval={slotInterval}
        onRangeChange={getEvents}
        onEventClick={onEventClick}
        onDateClick={onDateClick}
        renderEvent={renderEventAgenda}
      />

      {appointment && (
        <AppointmentDialog
          appointment={appointment}
          open
          onOpenChange={onDialogOpenChange}
        />
      )}
    </>
  );
};
