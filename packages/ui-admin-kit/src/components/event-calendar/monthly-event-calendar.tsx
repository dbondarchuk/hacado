import { useI18n, useLocale } from "@hacado/i18n/client";
import {
  cn,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  useTimeZone,
} from "@hacado/ui";
import { formatTimeLocale, hasSame, parseTime } from "@hacado/utils";

import { Clock } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { EventPopover } from "./event-popover";
import { EventItemContent } from "./event-item-content";
import { getEventAppearance } from "./styles";
import { MonthlyEventCalendarProps } from "./types";

const getDates = (currentDate: DateTime) => {
  const monthStart = currentDate.startOf("month");
  const monthEnd = currentDate.endOf("month");
  const startDate = monthStart.startOf("week");
  const endDate = monthEnd.endOf("week");

  return {
    monthStart,
    monthEnd,
    startDate,
    endDate,
    currentDate,
  };
};

type Dates = ReturnType<typeof getDates>;

export const MonthlyEventCalendar: React.FC<MonthlyEventCalendarProps> = ({
  date,
  events: propsEvents,
  className,
  schedule = {},
  onEventClick,
  onRangeChange,
  onDateClick,
}) => {
  const t = useI18n("admin");
  const locale = useLocale();
  const timeZone = useTimeZone();

  const [dates, setDates] = React.useState<Dates>(
    getDates(DateTime.fromJSDate(date || new Date()).setZone(timeZone)),
  );

  React.useEffect(() => {
    setDates(
      getDates(DateTime.fromJSDate(date || new Date()).setZone(timeZone)),
    );
  }, [date]);

  React.useEffect(() => {
    onRangeChange?.(dates.startDate.toJSDate(), dates.endDate.toJSDate());
  }, [dates]);

  const rows = [];
  let days = [];
  let day = dates.startDate;

  while (day <= dates.endDate) {
    for (let i = 0; i < 7; i++) {
      const dayClonned = day.plus({});
      const formattedDate = dayClonned.toFormat("d");

      const dayEvents = (propsEvents || []).filter((event) =>
        hasSame(DateTime.fromJSDate(event.start), dayClonned, "day"),
      );

      const isToday = hasSame(dayClonned, DateTime.now(), "day");
      const daySchedule = schedule[dayClonned.toISODate()!];
      const outsideMonth = !hasSame(dayClonned, dates.monthStart, "month");

      days.push(
        <div
          key={dayClonned.toString()}
          className={cn(
            "min-h-32 cursor-pointer p-2 transition-colors hover:bg-accent/30 relative",
            outsideMonth && "bg-muted/40 text-muted-foreground",
            isToday && "bg-accent/25",
          )}
          onClick={() => onDateClick?.(dayClonned.toJSDate())}
        >
          <div className="flex justify-between items-start gap-1">
            <span
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full text-base font-medium tabular-nums",
                isToday && "bg-brand text-brand-foreground shadow-sm",
                !isToday && !outsideMonth && "text-foreground",
              )}
            >
              {formattedDate}
            </span>
            {daySchedule?.length > 0 && (
              <TooltipResponsive>
                <TooltipResponsiveTrigger>
                  <span className="text-[12px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full flex items-center border border-primary/20">
                    <Clock className="h-3 w-3 md:mr-1" strokeWidth={1.5} />
                    <span className="hidden md:inline">
                      {t("calendar.work")}
                    </span>
                  </span>
                </TooltipResponsiveTrigger>
                <TooltipResponsiveContent className="bg-transparent">
                  <div className="bg-accent text-accent-foreground p-3 rounded-lg border border-primary/15 shadow-sm">
                    <div className="text-base font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2" strokeWidth={1.5} />
                      <span>{t("calendar.workingHours")}</span>
                    </div>
                    <div className="mt-1 flex flex-col gap-1">
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
                </TooltipResponsiveContent>
              </TooltipResponsive>
            )}
          </div>
          <div className="mt-2 space-y-1 overflow-y-auto max-h-24">
            {dayEvents.map((event, idx) => {
              const appearance = getEventAppearance(event);
              return (
                <EventPopover key={idx} event={event}>
                  <div
                    className={cn(
                      "text-[13px] leading-tight p-1.5 rounded-lg cursor-pointer shadow-sm min-w-0",
                      appearance.className,
                    )}
                    style={appearance.style}
                    onClick={(e) => {
                      onEventClick?.(event);
                      e.stopPropagation();
                    }}
                  >
                    <EventItemContent event={event} density="compact" />
                  </div>
                </EventPopover>
              );
            })}
          </div>
        </div>,
      );
      day = day.plus({ days: 1 });
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7">
        {days}
      </div>,
    );
    days = [];
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 overflow-hidden bg-card/40",
        className,
      )}
    >
      <div className="grid grid-cols-7 border-b border-border/60 bg-card">
        {[
          t("calendar.mon"),
          t("calendar.tue"),
          t("calendar.wed"),
          t("calendar.thu"),
          t("calendar.fri"),
          t("calendar.sat"),
          t("calendar.sun"),
        ].map((weekday) => (
          <div
            key={weekday}
            className="text-[13px] font-medium tracking-wide uppercase text-muted-foreground text-center py-3"
          >
            {weekday}
          </div>
        ))}
      </div>
      <div className="divide-y divide-border/60 [&>div]:divide-x [&>div]:divide-border/60">
        {rows}
      </div>
    </div>
  );
};
