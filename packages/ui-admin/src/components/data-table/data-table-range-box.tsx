"use client";

import { useI18n } from "@hacado/i18n/client";
import { DateRange } from "@hacado/types";
import { CalendarDateRangePicker, useTimeZone } from "@hacado/ui";
import { DateTime } from "luxon";
import { Options } from "nuqs";

const dateRangeOptions = [
  "thisMonth",
  "lastMonth",
  "thisWeek",
  "lastWeek",
  "thisYear",
  "lastYear",
  "nextWeek",
  "nextMonth",
  "allTime",
] as const;
type DateRangeOption = (typeof dateRangeOptions)[number];

const getDateRange = (
  option: DateRangeOption,
  timeZone: string,
): DateRange | undefined => {
  const now = DateTime.now().setZone(timeZone);

  switch (option) {
    case "thisMonth":
      return {
        start: now.startOf("month").toJSDate(),
        end: now.endOf("month").toJSDate(),
      };
    case "lastMonth":
      return {
        start: now.minus({ months: 1 }).startOf("month").toJSDate(),
        end: now.minus({ months: 1 }).endOf("month").toJSDate(),
      };
    case "thisWeek":
      return {
        start: now.startOf("week").toJSDate(),
        end: now.endOf("week").toJSDate(),
      };
    case "lastWeek":
      return {
        start: now.minus({ weeks: 1 }).startOf("week").toJSDate(),
        end: now.minus({ weeks: 1 }).endOf("week").toJSDate(),
      };
    case "thisYear":
      return {
        start: now.startOf("year").toJSDate(),
        end: now.endOf("year").toJSDate(),
      };
    case "lastYear":
      return {
        start: now.minus({ years: 1 }).startOf("year").toJSDate(),
        end: now.minus({ years: 1 }).endOf("year").toJSDate(),
      };
    case "nextWeek":
      return {
        start: now.plus({ weeks: 1 }).startOf("week").toJSDate(),
        end: now.plus({ weeks: 1 }).endOf("week").toJSDate(),
      };
    case "nextMonth":
      return {
        start: now.plus({ months: 1 }).startOf("month").toJSDate(),
        end: now.plus({ months: 1 }).endOf("month").toJSDate(),
      };
    case "allTime":
    default:
      return {
        start: now.minus({ years: 10 }).toJSDate(),
        end: now.plus({ years: 10 }).toJSDate(),
      };
  }
};

interface FilterBoxProps {
  title?: string;
  setStartValue: (
    value: Date | ((old: Date | null) => Date | null) | null,
    options?: Options | undefined,
  ) => Promise<URLSearchParams>;
  startValue: Date | null;
  setEndValue: (
    value: Date | ((old: Date | null) => Date | null) | null,
    options?: Options | undefined,
  ) => Promise<URLSearchParams>;
  endValue: Date | null;
}

export function DataTableRangeBox({
  title,
  startValue,
  setStartValue,
  endValue,
  setEndValue,
}: FilterBoxProps) {
  const t = useI18n("ui");
  const range: DateRange = {
    start: startValue || undefined,
    end: endValue || undefined,
  };

  const timeZone = useTimeZone();

  const onRangeChange = (newRange?: DateRange) => {
    setStartValue(newRange?.start || null);
    setEndValue(newRange?.end || null);
  };

  return (
    <CalendarDateRangePicker
      range={range}
      onChange={onRangeChange}
      className="w-auto"
      rangeOptions={dateRangeOptions.map((option) => ({
        label: t(`dateRangePicker.rangeOptions.${option}`),
        name: option,
        value: getDateRange(option, timeZone),
      }))}
      timeZone={timeZone}
    />
  );
}
