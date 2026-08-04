import { useI18n, useLocale } from "@timelish/i18n/client";
import { Button, cn, ScrollArea, useTimeZone } from "@timelish/ui";
import { formatTimeLocale, hasSame, parseTime } from "@timelish/utils";
import { CalendarIcon, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { EventPopover } from "./event-popover";
import { getEventAppearance } from "./styles";
import { AgendaEventCalendarProps, EventCalendarEvent } from "./types";

type EventsByDate = {
  date: DateTime;
  events: EventCalendarEvent[];
};

export const AgendaEventCalendar: React.FC<AgendaEventCalendarProps> = ({
  date,
  events: propsEvents,
  className,
  daysToShow = 3,
  schedule = {},
  onEventClick,
  onRangeChange,
  renderEvent,
}) => {
  const t = useI18n("admin");
  const locale = useLocale();
  const timeZone = useTimeZone();

  const [currentDate, setCurrentDate] = React.useState<DateTime>(
    DateTime.fromJSDate(date || new Date()),
  );

  React.useEffect(() => {
    setCurrentDate(DateTime.fromJSDate(date || new Date()));
  }, [date]);

  React.useEffect(() => {
    onRangeChange?.(
      currentDate.toJSDate(),
      currentDate
        .plus({ days: daysToShow - 1 })
        .endOf("day")
        .toJSDate(),
    );
  }, [currentDate, daysToShow]);

  const [expandedDates, setExpandedDates] = React.useState<
    Record<string, boolean>
  >({});

  const getEventsByDate = (): EventsByDate[] => {
    const eventsByDate: EventsByDate[] = [];
    const dateMap = new Map<string, EventCalendarEvent[]>();

    const dateRange: DateTime[] = [];
    for (let i = 0; i < daysToShow; i++) {
      dateRange.push(currentDate.plus({ days: i }));
    }

    dateRange.forEach((rangeDate) => {
      const dateKey = rangeDate.toFormat("yyyy-MM-dd");
      dateMap.set(dateKey, []);
    });

    propsEvents?.forEach((event) => {
      const eventDate = new Date(event.start);
      const dateKey = DateTime.fromJSDate(eventDate).toFormat("yyyy-MM-dd");

      if (dateMap.has(dateKey)) {
        dateMap.get(dateKey)?.push(event);
      }
    });

    dateRange.forEach((rangeDate) => {
      const dateKey = rangeDate.toFormat("yyyy-MM-dd");
      const dateEvents = dateMap.get(dateKey) || [];

      dateEvents.sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );

      eventsByDate.push({
        date: rangeDate,
        events: dateEvents,
      });
    });

    return eventsByDate;
  };

  const eventsByDate = getEventsByDate();

  const toggleDateExpansion = (dateKey: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const isDateExpanded = (rangeDate: DateTime): boolean => {
    const dateKey = rangeDate.toFormat("yyyy-MM-dd");

    if (expandedDates[dateKey] === undefined) {
      const hasEvents =
        (eventsByDate.find((item) => hasSame(item.date, rangeDate, "day"))
          ?.events.length ?? 0) > 0;

      return hasSame(rangeDate, DateTime.now(), "day") || hasEvents;
    }

    return expandedDates[dateKey];
  };

  return (
    <ScrollArea
      className={cn(
        "max-w-full rounded-2xl border border-border/60 bg-card/40 overflow-hidden",
        className,
      )}
    >
      <div className="space-y-2 p-3">
        {eventsByDate.map(({ date: rangeDate, events }) => {
          const dateKey = rangeDate.toISODate()!;
          const expanded = isDateExpanded(rangeDate);
          const hasEvents = events.length > 0;
          const isToday = hasSame(rangeDate, DateTime.now(), "day");
          const daySchedule = schedule[dateKey];

          return (
            <div
              key={dateKey}
              className="rounded-xl border border-border/60 overflow-hidden bg-background/50"
            >
              <div
                className={cn(
                  "flex items-center py-2.5 px-3 cursor-pointer transition-colors",
                  isToday
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/40",
                  hasEvents ? "font-medium" : "text-muted-foreground",
                )}
                onClick={() => toggleDateExpansion(dateKey)}
              >
                {expanded ? (
                  <ChevronDown
                    className="h-4 w-4 mr-2 opacity-60"
                    strokeWidth={1.5}
                  />
                ) : (
                  <ChevronRight
                    className="h-4 w-4 mr-2 opacity-60"
                    strokeWidth={1.5}
                  />
                )}
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full text-base font-medium tabular-nums mr-2",
                    isToday && "bg-brand text-brand-foreground shadow-sm",
                    !isToday && "bg-muted text-foreground",
                  )}
                >
                  {rangeDate.toFormat("d")}
                </span>
                <CalendarIcon
                  className="h-4 w-4 mr-2 opacity-50"
                  strokeWidth={1.5}
                />
                <span className="text-base">
                  {rangeDate.toLocaleString(
                    { weekday: "short", month: "short", day: "numeric" },
                    { locale },
                  )}
                  {isToday && (
                    <span className="ml-1.5 text-sm text-brand font-medium">
                      ({t("calendar.today")})
                    </span>
                  )}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  {daySchedule?.length > 0 && (
                    <span className="text-[12px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full flex items-center border border-primary/20">
                      <Clock className="h-3 w-3 mr-1" strokeWidth={1.5} />
                      <span>{t("calendar.workingDay")}</span>
                    </span>
                  )}
                  {hasEvents && (
                    <span className="text-sm text-muted-foreground">
                      {events.length}{" "}
                      {events.length === 1
                        ? t("calendar.event")
                        : t("calendar.events")}
                    </span>
                  )}
                </div>
              </div>

              {expanded && (
                <div className="px-3 pb-3 pt-1 space-y-2 bg-background/40">
                  {daySchedule?.length > 0 && (
                    <div className="mb-2 bg-accent/60 p-3 rounded-lg border border-primary/15">
                      <div className="text-base font-medium flex items-center text-accent-foreground">
                        <Clock className="h-4 w-4 mr-2" strokeWidth={1.5} />
                        {t("calendar.workingHours")}
                      </div>
                      <div className="mt-1 flex flex-row gap-2 flex-wrap">
                        {daySchedule.map((hours, idx) => (
                          <div
                            key={idx}
                            className="text-base text-accent-foreground/80"
                          >
                            {formatTimeLocale(parseTime(hours.start), locale)} -{" "}
                            {formatTimeLocale(parseTime(hours.end), locale)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {events.length === 0 ? (
                    <div className="text-muted-foreground text-base py-2 px-1">
                      {t("calendar.noEventsScheduled")}
                    </div>
                  ) : (
                    events.map((event, idx) => {
                      const eventDate = DateTime.fromJSDate(
                        event.start,
                      ).setZone(timeZone);
                      const endDate = DateTime.fromJSDate(event.end).setZone(
                        timeZone,
                      );

                      const appearance = getEventAppearance(event);
                      return (
                        <EventPopover key={idx} event={event}>
                          <div
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors shadow-sm",
                              appearance.className,
                            )}
                            style={appearance.style}
                            onClick={(e) => {
                              onEventClick?.(event);
                              e.stopPropagation();
                            }}
                          >
                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                              <div
                                className="text-[12px] opacity-70"
                                suppressHydrationWarning
                              >
                                {eventDate.toLocaleString(
                                  DateTime.TIME_SIMPLE,
                                  {
                                    locale,
                                  },
                                )}{" "}
                                –{" "}
                                {endDate.toLocaleString(DateTime.TIME_SIMPLE, {
                                  locale,
                                })}
                              </div>
                              <div className="font-medium text-base truncate">
                                {event.title}
                              </div>
                              {renderEvent && renderEvent(event)}
                            </div>
                          </div>
                        </EventPopover>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {eventsByDate.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          {t("calendar.noEventsInRange")}
        </div>
      )}

      <div className="px-3 pb-3 flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => setExpandedDates({})}
        >
          {t("calendar.collapseAll")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => {
            const allExpanded: Record<string, boolean> = {};
            eventsByDate.forEach(({ date: rangeDate }) => {
              const dateKey = rangeDate.toFormat("yyyy-MM-dd");
              allExpanded[dateKey] = true;
            });
            setExpandedDates(allExpanded);
          }}
        >
          {t("calendar.expandAll")}
        </Button>
      </div>
    </ScrollArea>
  );
};
