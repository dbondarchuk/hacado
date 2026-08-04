"use client";

import { useI18n } from "@timelish/i18n/client";
import { WeekIdentifier } from "@timelish/types";
import {
  Button,
  Card,
  CardContent,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@timelish/ui";
import {
  eachOfInterval,
  getDateFromWeekIdentifier,
  getWeekIdentifier,
  hasSame,
} from "@timelish/utils";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

export type WeekSelectorProps = {
  onWeekChange?: (week: WeekIdentifier) => void;
  initialWeek?: WeekIdentifier;
  minWeek?: WeekIdentifier;
  maxWeek?: WeekIdentifier;
  className?: string;
  disabled?: boolean;
};

export const WeekSelector: FC<WeekSelectorProps> = ({
  onWeekChange,
  initialWeek,
  minWeek,
  maxWeek,
  className,
  disabled,
}) => {
  const t = useI18n("ui");
  const [week, setWeek] = useState(
    initialWeek ?? getWeekIdentifier(new Date()),
  );

  const viewDate = useMemo(
    () => DateTime.fromJSDate(getDateFromWeekIdentifier(week)),
    [week],
  );

  const [isOpen, setIsOpen] = useState(false);

  const minDate = useMemo(
    () =>
      minWeek
        ? DateTime.fromJSDate(getDateFromWeekIdentifier(minWeek)).startOf("day")
        : DateTime.now().startOf("day").minus({ years: 10 }),
    [minWeek],
  );
  const maxDate = useMemo(
    () =>
      maxWeek
        ? DateTime.fromJSDate(getDateFromWeekIdentifier(maxWeek)).endOf("day")
        : DateTime.now().endOf("day").plus({ years: 10 }),
    [maxWeek],
  );

  // Memoize the updateDate function to prevent recreating it on every render
  const updateWeek = useCallback(
    (newWeek: WeekIdentifier) => {
      if (week === newWeek) return;

      setWeek(newWeek);

      if (onWeekChange) {
        onWeekChange(newWeek);
      }
    },
    [onWeekChange, week],
  );

  // Calculate the start and end of the week - memoize to prevent recalculation on every render
  const weekStart = useMemo(() => viewDate.startOf("week"), [viewDate]); // Start on Monday
  const weekEnd = useMemo(() => viewDate.endOf("week"), [viewDate]); // End on Sunday

  // Format the date range
  const dateRangeText = `${weekStart.toFormat("MMM d")} - ${weekEnd.toFormat("MMM d, yyyy")}`;

  // Ensure initialDate is within min/max bounds - only run once on mount or when dependencies change
  useEffect(() => {
    let week = initialWeek || getWeekIdentifier(new Date());
    const date = (w: WeekIdentifier) =>
      DateTime.fromJSDate(getDateFromWeekIdentifier(w));

    if (minDate && date(week) < minDate) {
      week = getWeekIdentifier(minDate);
    }

    if (maxDate && date(week) > maxDate) {
      week = getWeekIdentifier(maxDate);
    }

    setWeek(week);
  }, [initialWeek, minDate, maxDate]);

  // Generate years based on min/max dates or default to 10 years before/after current
  const years = useMemo(() => {
    return eachOfInterval(minDate, maxDate, "year").map((date) => date.year);
  }, [minDate, maxDate]);

  const currentYear = useMemo(() => viewDate.year, [viewDate]);

  // Generate months
  const months = useMemo(
    () =>
      eachOfInterval(
        viewDate.startOf("year"),
        viewDate.endOf("year"),
        "month",
      ).map((date) => ({
        value: date.month.toString(),
        label: date.toFormat("MMMM"),
      })),
    [currentYear],
  );

  // Generate calendar days
  const weeks = useMemo(() => {
    const monthStart = viewDate.startOf("month");
    const monthEnd = viewDate.endOf("month");
    const calendarStart = monthStart.startOf("week");
    const calendarEnd = monthEnd.endOf("week");

    const days = eachOfInterval(calendarStart, calendarEnd, "day");

    // Group days into weeks
    const result: DateTime[][] = [];
    let currentWeek: DateTime[] = [];

    days.forEach((day, index) => {
      currentWeek.push(day);
      if (index % 7 === 6) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    return result;
  }, [viewDate]);

  // Check if a week is selectable (all days within min/max range)
  const isWeekSelectable = useCallback(
    (week: WeekIdentifier) => {
      // If no min/max constraints, week is selectable
      if (!minDate && !maxDate) return true;

      const start = DateTime.fromJSDate(
        getDateFromWeekIdentifier(week),
      ).startOf("week");
      const end = start.endOf("week");

      const days = eachOfInterval(start, end, "day");

      // Check if any day in the week is outside the min/max range
      for (const day of days) {
        if (minDate && day < minDate) return false;
        if (maxDate && day > maxDate) return false;
      }

      return true;
    },
    [minDate, maxDate],
  );

  // Check if we can navigate to previous month
  const canGoToPreviousMonth = useMemo(() => {
    if (!minDate) return true;

    const previousMonth = viewDate.minus({ months: 1 });
    return previousMonth.startOf("month") >= minDate.startOf("month");
  }, [viewDate, minDate]);

  // Check if we can navigate to next month
  const canGoToNextMonth = useMemo(() => {
    if (!maxDate) return true;

    const nextMonth = viewDate.plus({ months: 1 });
    return nextMonth.endOf("month") <= maxDate.endOf("month");
  }, [viewDate, maxDate]);

  const goToPreviousMonth = useCallback(() => {
    if (!canGoToPreviousMonth) return;

    updateWeek(getWeekIdentifier(viewDate.minus({ months: 1 })));
  }, [canGoToPreviousMonth, updateWeek, viewDate]);

  const goToNextMonth = useCallback(() => {
    if (!canGoToNextMonth) return;

    updateWeek(getWeekIdentifier(viewDate.plus({ months: 1 })));
  }, [canGoToNextMonth, updateWeek, viewDate]);

  const goToCurrentWeek = useCallback(() => {
    const today: DateTime = DateTime.now();

    // Ensure today is within min/max bounds
    let dateToUse = today;
    if (minDate && today < minDate) {
      dateToUse = minDate;
    }
    if (maxDate && today > maxDate) {
      dateToUse = maxDate;
    }

    updateWeek(getWeekIdentifier(dateToUse));
  }, [minDate, maxDate, updateWeek, onWeekChange]);

  const handleYearChange = useCallback(
    (yearStr: string) => {
      const year = Number.parseInt(yearStr, 10);

      const newDate = viewDate.set({ year });

      // Ensure the new date is within min/max bounds
      if (minDate && newDate < minDate) {
        return minDate.set({ year });
      }
      if (maxDate && newDate > maxDate) {
        return maxDate.set({ year });
      }

      updateWeek(getWeekIdentifier(newDate));
    },
    [minDate, maxDate, updateWeek, viewDate],
  );

  const handleMonthChange = useCallback(
    (monthStr: string) => {
      const month = Number.parseInt(monthStr, 10);

      const newDate = viewDate.set({ month });

      // Ensure the new date is within min/max bounds
      if (minDate && newDate < minDate && newDate.year === minDate.year) {
        return newDate.set({ month: minDate.month });
      }
      if (maxDate && newDate > maxDate && newDate.year === maxDate.year) {
        return newDate.set({ month: maxDate.month });
      }

      updateWeek(getWeekIdentifier(newDate));
    },
    [minDate, maxDate, updateWeek, viewDate],
  );

  const selectWeek = useCallback(
    (week: WeekIdentifier) => {
      if (!isWeekSelectable(week)) return;

      updateWeek(week);

      setIsOpen(false);
    },
    [isWeekSelectable, updateWeek, setIsOpen],
  );

  // // Trigger onWeekChange on initial render - with proper dependency array
  // useEffect(() => {
  //   if (onWeekChange) {
  //     onWeekChange(getWeekIdentifier(viewDate));
  //   }
  // }, [onWeekChange, viewDate]);

  // Day names for the calendar header
  const dayNames = [
    t("calendar.mon"),
    t("calendar.tue"),
    t("calendar.wed"),
    t("calendar.thu"),
    t("calendar.fri"),
    t("calendar.sat"),
    t("calendar.sun"),
  ];
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full max-w-full justify-center text-left font-normal py-2",
            className,
          )}
        >
          <Calendar />
          <span>{dateRangeText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[320px] p-0" align="start">
        <Card className="border-0 shadow-none">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPreviousMonth}
                  disabled={!canGoToPreviousMonth}
                  aria-label={t("calendar.previousMonth")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex gap-2">
                  <Select
                    value={viewDate.month.toString()}
                    onValueChange={handleMonthChange}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue placeholder={t("calendar.month")} />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => {
                        // Disable months outside min/max range for current year
                        const isDisabled =
                          (minDate &&
                            minDate.year === currentYear &&
                            Number.parseInt(month.value) < minDate.month) ||
                          (maxDate &&
                            maxDate.year === currentYear &&
                            Number.parseInt(month.value) > maxDate.month);

                        return (
                          <SelectItem
                            key={month.value}
                            value={month.value}
                            disabled={isDisabled}
                          >
                            {month.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <Select
                    value={viewDate.year.toString()}
                    onValueChange={handleYearChange}
                  >
                    <SelectTrigger className="h-8 w-[90px]">
                      <SelectValue placeholder={t("calendar.year")} />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextMonth}
                  disabled={!canGoToNextMonth}
                  aria-label={t("calendar.nextMonth")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="calendar">
                {/* Calendar header with day names */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-muted-foreground py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid with weeks */}
                <div className="space-y-1">
                  {weeks.map((week, weekIndex) => {
                    // Check if this week contains the selected date
                    const isSelectedWeek = week.some(
                      (day) => day >= weekStart && day <= weekEnd,
                    );

                    const weekIdentifier = getWeekIdentifier(week[1]);

                    // Check if this week is selectable
                    const weekSelectable = isWeekSelectable(weekIdentifier);

                    return (
                      <div
                        key={weekIndex}
                        className={cn(
                          "grid grid-cols-7 gap-1 relative",
                          isSelectedWeek && "bg-primary/10 rounded-md",
                          !weekSelectable && "opacity-50",
                        )}
                      >
                        {/* Clickable overlay for the entire week */}
                        {weekSelectable && (
                          <button
                            className="absolute inset-0 cursor-pointer z-10"
                            onClick={() => selectWeek(weekIdentifier)}
                            aria-label={`Select week of ${week[0].toFormat("MMM d")}`}
                          />
                        )}

                        {week.map((day, dayIndex) => {
                          // Check if day is outside min/max range
                          const isDisabled =
                            (minDate && day < minDate) ||
                            (maxDate && day > maxDate);

                          return (
                            <div
                              key={dayIndex}
                              className={cn(
                                "text-center py-2 relative z-0",
                                !hasSame(day, viewDate, "month") &&
                                  "text-muted-foreground opacity-50",
                                hasSame(day, DateTime.now(), "day") &&
                                  "bg-primary text-primary-foreground rounded-md",
                                isDisabled &&
                                  "text-muted-foreground opacity-30",
                              )}
                            >
                              <span className="text-sm">
                                {day.toFormat("d")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
                className="self-center"
              >
                {t("calendar.today")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
