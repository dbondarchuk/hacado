"use client";

import { useI18n, useLocale } from "@hacado/i18n/client";
import {
  Button,
  Calendar,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useIsMobile,
} from "@hacado/ui";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { AgendaEventCalendar } from "./agenda-event-calendar";
import { MonthlyEventCalendar } from "./monthly-event-calendar";
import type { EventCalendarProps, EventCalendarView } from "./types";
import { WeeklyEventCalendar } from "./weekly-event-calendar";

const SWITCHABLE_VIEWS: Array<{
  value: Exclude<EventCalendarView, "days-around">;
  labelKey:
    | "calendar.day"
    | "calendar.week"
    | "calendar.month"
    | "calendar.agenda";
}> = [
  { value: "daily", labelKey: "calendar.day" },
  { value: "weekly", labelKey: "calendar.week" },
  { value: "monthly", labelKey: "calendar.month" },
  { value: "agenda", labelKey: "calendar.agenda" },
];

function shiftDate(
  date: DateTime,
  view: EventCalendarView,
  direction: -1 | 1,
  daysAround: number,
  daysToShow: number,
): DateTime {
  switch (view) {
    case "daily":
      return date.plus({ days: direction });
    case "weekly":
      return date.plus({ weeks: direction });
    case "monthly":
      return date.plus({ months: direction });
    case "agenda":
      return date.plus({ days: direction * daysToShow });
    case "days-around":
      return date.plus({ days: direction * (daysAround + 1) });
    default:
      return date.plus({ days: direction });
  }
}

function formatDateLabel(
  date: DateTime,
  view: EventCalendarView,
  locale: string,
  daysAround: number,
  daysToShow: number,
  showShort: boolean,
): string {
  const format: Intl.DateTimeFormatOptions = showShort
    ? { month: "short", day: "numeric" }
    : DateTime.DATE_MED;

  switch (view) {
    case "daily": {
      return date.toLocaleString(format, { locale });
    }
    case "weekly": {
      const start = date.startOf("week");
      const end = date.endOf("week");
      const startLabel = start.toLocaleString(format, { locale });
      const endLabel = end.toLocaleString(format, { locale });
      return `${startLabel} – ${endLabel}`;
    }
    case "monthly": {
      return date.toLocaleString(
        { month: "long", year: "numeric" },
        { locale },
      );
    }
    case "agenda": {
      const end = date.plus({ days: daysToShow - 1 });
      return `${date.toLocaleString(format, { locale })} – ${end.toLocaleString(format, { locale })}`;
    }
    case "days-around": {
      const start = date.minus({ days: daysAround });
      const end = date.plus({ days: daysAround });
      const startLabel = start.toLocaleString(format, { locale });
      const endLabel = end.toLocaleString(format, { locale });
      return startLabel === endLabel
        ? startLabel
        : `${startLabel} – ${endLabel}`;
    }
    default:
      return date.toLocaleString(format, { locale });
  }
}

export const EventCalendar: React.FC<EventCalendarProps> = ({
  events,
  schedule,
  className,
  loading = false,
  date: dateProp,
  onDateChange,
  view: viewProp,
  defaultView = "weekly",
  onViewChange,
  showControls = true,
  allowTimeChange = true,
  allowViewSwitch = true,
  daysAround = 3,
  daysToShow = 3,
  scrollToHour,
  slotInterval,
  onRangeChange,
  onEventClick,
  onDateClick,
  renderEvent,
  controlsAfterViewSwitch,
}) => {
  const t = useI18n("admin");
  const locale = useLocale();
  const isMobile = useIsMobile();

  const [uncontrolledDate, setUncontrolledDate] = React.useState(
    () => dateProp ?? new Date(),
  );
  const [uncontrolledView, setUncontrolledView] =
    React.useState<EventCalendarView>(viewProp ?? defaultView);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  const date = dateProp ?? uncontrolledDate;
  const view = viewProp ?? uncontrolledView;

  React.useEffect(() => {
    if (dateProp) {
      setUncontrolledDate(dateProp);
    }
  }, [dateProp]);

  React.useEffect(() => {
    if (viewProp) {
      setUncontrolledView(viewProp);
    }
  }, [viewProp]);

  const setDate = (next: Date) => {
    if (!dateProp) {
      setUncontrolledDate(next);
    }
    onDateChange?.(next);
  };

  const setView = (next: EventCalendarView) => {
    if (!viewProp) {
      setUncontrolledView(next);
    }
    onViewChange?.(next);
  };

  const showViewSwitch =
    showControls && allowViewSwitch && view !== "days-around";
  const showTimeNav = showControls && allowTimeChange;

  const dateTime = DateTime.fromJSDate(date).startOf("day");
  const dateLabel = formatDateLabel(
    dateTime,
    view,
    locale,
    daysAround,
    daysToShow,
    isMobile && showTimeNav,
  );

  const goToday = () => setDate(DateTime.now().startOf("day").toJSDate());
  const goPrevious = () =>
    setDate(shiftDate(dateTime, view, -1, daysAround, daysToShow).toJSDate());
  const goNext = () =>
    setDate(shiftDate(dateTime, view, 1, daysAround, daysToShow).toJSDate());

  const viewClassName = cn("w-full", className);

  return (
    <div className="relative w-full flex flex-col gap-3">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{t("common.labels.loading")}</span>
            <svg
              className="animate-spin h-7 w-7 text-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      )}

      {showControls && (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="justify-self-start">
            {showTimeNav ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToday}
                  className="rounded-full md:hidden"
                  aria-label={t("calendar.today")}
                >
                  <span className="text-sm font-semibold tabular-nums leading-none">
                    {DateTime.now().day}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  onClick={goToday}
                  className="hidden rounded-full px-4 md:inline-flex"
                >
                  {t("calendar.today")}
                </Button>
              </>
            ) : null}
          </div>

          <div className="justify-self-center flex flex-row items-center gap-1 min-w-0">
            {showTimeNav && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full shrink-0"
                onClick={goPrevious}
              >
                <ChevronLeft className="size-4" strokeWidth={1.5} />
              </Button>
            )}
            {showTimeNav ? (
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-auto min-w-0 max-w-[16rem] rounded-full px-3 py-1.5 font-display text-lg font-medium tracking-tight truncate"
                    aria-label={dateLabel}
                  >
                    {dateLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={dateTime.toJSDate()}
                    defaultMonth={dateTime.toJSDate()}
                    onSelect={(selected) => {
                      if (!selected) return;
                      setDate(
                        DateTime.fromJSDate(selected).startOf("day").toJSDate(),
                      );
                      setDatePickerOpen(false);
                    }}
                    numberOfMonths={1}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <div className="text-base font-medium tracking-tight px-2 truncate text-center">
                {dateLabel}
              </div>
            )}
            {showTimeNav && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full shrink-0"
                onClick={goNext}
              >
                <ChevronRight className="size-4" strokeWidth={1.5} />
              </Button>
            )}
          </div>

          <div className="justify-self-end flex flex-row items-center gap-2 min-w-0">
            {showViewSwitch ? (
              <>
                <div className="lg:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        aria-label={t(
                          SWITCHABLE_VIEWS.find((item) => item.value === view)
                            ?.labelKey ?? "calendar.week",
                        )}
                      >
                        <CalendarDays className="size-4" strokeWidth={1.5} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuRadioGroup
                        value={view}
                        onValueChange={(value) =>
                          setView(value as EventCalendarView)
                        }
                      >
                        {SWITCHABLE_VIEWS.map((item) => (
                          <DropdownMenuRadioItem
                            key={item.value}
                            value={item.value}
                          >
                            {t(item.labelKey)}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="hidden lg:inline-flex shrink-0 flex-nowrap rounded-full border border-border/70 bg-muted/40 p-0.5">
                  {SWITCHABLE_VIEWS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setView(item.value)}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-base whitespace-nowrap transition-colors",
                        view === item.value
                          ? "bg-background text-foreground shadow-sm border border-primary/40"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            {controlsAfterViewSwitch}
          </div>
        </div>
      )}

      {view === "weekly" ? (
        <WeeklyEventCalendar
          date={date}
          events={events}
          schedule={schedule}
          variant="week-of"
          className={viewClassName}
          scrollToHour={scrollToHour}
          slotInterval={slotInterval}
          onRangeChange={onRangeChange}
          onEventClick={onEventClick}
        />
      ) : view === "daily" ? (
        <WeeklyEventCalendar
          date={date}
          events={events}
          schedule={schedule}
          variant="days-around"
          daysAround={0}
          className={viewClassName}
          scrollToHour={scrollToHour}
          slotInterval={slotInterval}
          onRangeChange={onRangeChange}
          onEventClick={onEventClick}
        />
      ) : view === "days-around" ? (
        <WeeklyEventCalendar
          date={date}
          events={events}
          schedule={schedule}
          variant="days-around"
          daysAround={daysAround}
          className={viewClassName}
          scrollToHour={scrollToHour}
          slotInterval={slotInterval}
          onRangeChange={onRangeChange}
          onEventClick={onEventClick}
        />
      ) : view === "agenda" ? (
        <AgendaEventCalendar
          date={date}
          events={events}
          schedule={schedule}
          daysToShow={daysToShow}
          className={viewClassName}
          onRangeChange={onRangeChange}
          onEventClick={onEventClick}
          renderEvent={renderEvent}
        />
      ) : (
        <MonthlyEventCalendar
          date={date}
          events={events}
          schedule={schedule}
          className={viewClassName}
          onRangeChange={onRangeChange}
          onEventClick={onEventClick}
          onDateClick={onDateClick}
        />
      )}
    </div>
  );
};
