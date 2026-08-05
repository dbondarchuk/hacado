"use client";
import { CalendarIcon } from "@radix-ui/react-icons";
import { useI18n } from "@hacado/i18n/client";
import { DateRange } from "@hacado/types";
import { X } from "lucide-react";
import { DateTime } from "luxon";
import React from "react";
import { cn } from "../utils";
import { Button } from "./button";
import { Calendar, CalendarProps } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type RangeOption = {
  label: string;
  name: string;
  value: DateRange | undefined;
};

export type CalendarDateRangePickerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> &
  Omit<
    Extract<CalendarProps, { mode: "range" }>,
    "mode" | "defaultMonth" | "selected" | "onSelect" | "numberOfMonths"
  > & {
    range?: DateRange;
    onChange?: (range?: DateRange) => void;
    rangeOptions?: RangeOption[];
  };

export const CalendarDateRangePicker: React.FC<
  CalendarDateRangePickerProps
> = ({ className, range, onChange, rangeOptions, ...rest }) => {
  const t = useI18n("ui");
  const [date, setDate] = React.useState<DateRange | undefined>(range);
  React.useEffect(() => {
    setDate(range);
  }, [range]);

  const onSelect = (range?: DateRange) => {
    setDate(range);
    onChange?.(range);
  };

  const getDateTime = (date: Date) => {
    const d = DateTime.fromJSDate(date);
    if (rest.timeZone) {
      return d.setZone(rest.timeZone, { keepLocalTime: true });
    }
    return d;
  };

  return (
    <div className={cn("grid gap-2 w-full", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal text-base",
            )}
          >
            <CalendarIcon className="mr-2 size-3.5" />
            {date?.start ? (
              date.end ? (
                <>
                  {DateTime.fromJSDate(date.start).toFormat("LLL dd, y")} -{" "}
                  {DateTime.fromJSDate(date.end).toFormat("LLL dd, y")}
                </>
              ) : (
                DateTime.fromJSDate(date.start).toFormat("LLL dd, y")
              )
            ) : (
              <span className="text-muted-foreground">
                {t("dateRangePicker.placeholder")}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-row gap-2" align="end">
          {!!rangeOptions?.length && (
            <div className="flex flex-col gap-1 px-2 py-4">
              {rangeOptions?.map((option) => (
                <Button
                  key={option.name}
                  variant="outline"
                  className="w-full"
                  onClick={() => onSelect(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}
          <div className="flex flex-col">
            <Calendar
              autoFocus
              {...rest}
              mode="range"
              defaultMonth={date?.start}
              selected={{
                from: date?.start,
                to: date?.end,
              }}
              numberOfMonths={2}
              onSelect={(range) =>
                onSelect(
                  range
                    ? {
                        start: range.from
                          ? getDateTime(range.from).startOf("day").toJSDate()
                          : undefined,
                        end: range.to
                          ? getDateTime(range.to).endOf("day").toJSDate()
                          : undefined,
                      }
                    : undefined,
                )
              }
            />
            {(!!date?.start || !!date?.end) && (
              <div className="px-2 py-1 w-full">
                <Button
                  variant="ghost"
                  onClick={() => onSelect(undefined)}
                  className="w-full"
                >
                  <X /> {t("common.clear")}
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
