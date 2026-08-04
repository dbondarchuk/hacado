"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { DayPicker, DropdownProps } from "react-day-picker";

import { ScrollArea } from "@radix-ui/react-scroll-area";
import { useLocale } from "@timelish/i18n/client";
import { DateTime } from "luxon";
import { useIsMobile } from "../hooks";
import { cn } from "../utils";
import { buttonVariants } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;
const endMonth = DateTime.now().plus({ years: 10 }).toJSDate();

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const isMobile = useIsMobile();
  const locale = useLocale();
  return (
    <DayPicker
      lang={locale}
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown"
      className={cn("p-3", className)}
      classNames={{
        ...classNames,
        month: cn("space-y-4", classNames?.month),
        months: cn(
          "flex flex-col md:flex-row space-y-0 relative gap-4",
          classNames?.months,
        ),
        month_caption: cn(
          "flex justify-center pt-1 relative items-center",
          classNames?.month_caption,
        ),
        month_grid: cn(
          "border-collapse space-y-1 justify-self-center w-full",
          classNames?.month_grid,
        ),

        // TEST
        dropdowns: cn("flex justify-center gap-1", classNames?.dropdowns),
        nav: cn(
          "flex items-center justify-between absolute inset-x-0 top-2",
          classNames?.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 z-10",
          classNames?.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 z-10",
          classNames?.button_next,
        ),
        // TEST

        weeks: cn("w-full border-collapse space-y-", classNames?.weeks),
        weekdays: cn("flex", classNames?.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md w-9 font-normal text-[0.925rem] flex-grow",
          classNames?.weekday,
        ),
        week: cn("flex w-full mt-2", classNames?.week),
        day_button: cn(
          "h-9 w-9  text-center text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          classNames?.day_button,
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "flex-grow h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          classNames?.day,
        ),
        range_end: cn("day-range-end", classNames?.range_end),
        selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          classNames?.selected,
        ),
        outside: cn(
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          classNames?.outside,
        ),
        disabled: cn("text-muted-foreground opacity-50", classNames?.disabled),
        range_middle: cn(
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
          classNames?.range_middle,
        ),
        hidden: cn("invisible", classNames?.hidden),
      }}
      endMonth={endMonth}
      {...props}
      numberOfMonths={isMobile ? 1 : props.numberOfMonths}
      components={{
        Dropdown: ({ value, onChange, options }: DropdownProps) => {
          const selected = options?.find((child) => child.value === value);
          const handleChange = (value: string) => {
            const changeEvent = {
              target: { value },
            } as React.ChangeEvent<HTMLSelectElement>;
            onChange?.(changeEvent);
          };
          return (
            <Select
              value={value?.toString()}
              onValueChange={(value) => {
                handleChange(value);
              }}
            >
              <SelectTrigger className="pr-1.5 focus:ring-0 focus:outline-none focus:ring-transparent">
                <SelectValue>{selected?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper">
                <ScrollArea className="h-80">
                  {options?.map((option, id: number) => (
                    <SelectItem
                      key={`${option.value}-${id}`}
                      value={option.value?.toString() ?? ""}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          );
        },
        Chevron: ({ ...props }) =>
          props.orientation === "left" ? (
            <ChevronLeft {...props} className="h-4 w-4" />
          ) : (
            <ChevronRight {...props} className="h-4 w-4" />
          ),
        ...props.components,
      }}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
