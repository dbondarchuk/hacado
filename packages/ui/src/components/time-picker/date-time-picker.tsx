"use client";

// import React from "react";
// import { Calendar as CalendarIcon } from "lucide-react";

// import { cn } from "../../utils";
// import { Button } from "../button";
// import { Calendar, CalendarProps } from "../calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "../popover";
// import { TimePicker } from "./time-picker";
// import { DateTime } from "luxon";

// export type DateTimePickerProps = Pick<CalendarProps, "fromDate" | "toDate"> & {
//   value?: Date;
//   onChange: (newValue: Date) => void;
//   className?: string;
// };

// export const DateTimePicker: React.FC<DateTimePickerProps> = ({
//   value,
//   onChange,
//   className,
//   ...calendarProps
// }) => {
//   const [date, setDate] = React.useState<DateTime | undefined>(
//     value ? DateTime.fromJSDate(value) : undefined
//   );

//   const changeDate = (newDate: DateTime) => {
//     setDate(date);
//     onChange(newDate.toJSDate());
//   };

//   React.useEffect(() => {
//     setDate(value ? DateTime.fromJSDate(value) : undefined);
//   }, [value, setDate]);

//   /**
//    * carry over the current time when a user clicks a new day
//    * instead of resetting to 00:00
//    */
//   const handleSelect = (newDay: Date | undefined) => {
//     if (!newDay) return;
//     const newDateTime = DateTime.fromJSDate(newDay);

//     if (!date) {
//       changeDate(newDateTime);
//       return;
//     }

//     const newDateFull = date.set({
//       year: newDateTime.year,
//       month: newDateTime.month,
//       day: newDateTime.day,
//     });

//     changeDate(newDateFull);
//   };

//   const handleTimeSelect = (newDay: Date | undefined) => {
//     if (!newDay) return;

//     const newDateTime = DateTime.fromJSDate(newDay);
//     changeDate(newDateTime);
//   };

//   return (
//     <Popover modal>
//       <PopoverTrigger asChild>
//         <Button
//           suppressHydrationWarning
//           variant={"outline"}
//           className={cn(
//             "w-[280px] justify-start text-left font-normal",
//             !date && "text-muted-foreground",
//             className
//           )}
//         >
//           <CalendarIcon />
//           {date ? (
//             date.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS)
//           ) : (
//             <span>Pick a date</span>
//           )}
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent className="w-auto p-0">
//         <Calendar
//           mode="single"
//           selected={date?.toJSDate()}
//           onSelect={(d) => handleSelect(d)}
//           initialFocus
//           className="*:justify-center"
//           {...calendarProps}
//         />
//         <div className="p-3 border-t border-border">
//           <TimePicker setDate={handleTimeSelect} date={date?.toJSDate()} />
//         </div>
//       </PopoverContent>
//     </Popover>
//   );
// };

/**
 * Shadcn Datetime Picker with support for timeZone, date and time selection, minimum and maximum date limits, and 12-hour format...
 * Check out the live demo at https://shadcn-datetime-picker-pro.vercel.app/
 * Find the latest source code at https://github.com/huybuidac/shadcn-datetime-picker
 */
"use client";

import { CalendarIcon } from "@radix-ui/react-icons";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  X,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DayPicker, Matcher } from "react-day-picker";

import { useLocale } from "@hacado/i18n/client";
import { DateTime } from "luxon";
import { cn } from "../../utils";
import { Button, buttonVariants } from "../button";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { ScrollArea } from "../scroll-area";
import { SimpleTimePicker } from "./simple-time-picker";

export type DateTimeCalendarProps = Omit<
  React.ComponentProps<typeof DayPicker>,
  "mode" | "disabled"
>;

const AM_VALUE = 0;
const PM_VALUE = 1;

export type DateTimePickerProps = {
  /**
   * The modality of the popover. When set to true, interaction with outside elements will be disabled and only popover content will be visible to screen readers.
   * If you want to use the datetime picker inside a dialog, you should set this to true.
   * @default false
   */
  modal?: boolean;
  /**
   * The datetime value to display and control.
   */
  value: Date | undefined;
  /**
   * Callback function to handle datetime changes.
   */
  onChange: (date: Date | undefined) => void;
  /**
   * The minimum datetime value allowed.
   * @default undefined
   */
  min?: Date;
  /**
   * The maximum datetime value allowed.
   */
  max?: Date;
  /**
   * The timeZone to display the datetime in, based on the date-fns.
   * For a complete list of valid time zone identifiers, refer to:
   * https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   * @default undefined
   */
  timeZone?: string;
  /**
   * Whether the datetime picker is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the datetime picker is disabled.
   * @default false
   */
  disabledDays?: (date: Date) => boolean;
  /**
   * Whether to show the time picker.
   * @default false
   */
  hideTime?: boolean;
  /**
   * Whether to use 12-hour format.
   * @default false
   */
  use12HourFormat?: boolean;
  /**
   * Whether to show the clear button.
   * @default false
   */
  clearable?: boolean;
  /**
   * Custom class names for the component.
   */
  classNames?: {
    /**
     * Custom class names for the trigger (the button that opens the picker).
     */
    trigger?: string;
  };
  /**
   * Should time picker show seconds
   * @default false
   */
  showSeconds?: boolean;
  /**
   * Custom render function for the trigger.
   */
  renderTrigger?: (props: DateTimeRenderTriggerProps) => React.ReactNode;
  /** Trigger onChange after each change */
  commitOnChange?: boolean;
  /** If present, only show minutes that are divisible by this number */
  minutesDivisibleBy?: number;

  locale?: string;
};

export type DateTimeRenderTriggerProps = {
  value: Date | undefined;
  open: boolean;
  timeZone?: string;
  disabled?: boolean;
  use12HourFormat?: boolean;
  setOpen: (open: boolean) => void;
};

export function DateTimePicker({
  value,
  onChange,
  renderTrigger,
  min,
  max,
  timeZone,
  hideTime,
  use12HourFormat,
  disabled,
  clearable,
  classNames,
  showSeconds = false,
  modal = true,
  commitOnChange = false,
  minutesDivisibleBy,
  disabledDays,
  ...props
}: DateTimePickerProps & DateTimeCalendarProps) {
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [monthYearPicker, setMonthYearPicker] = useState<
    "month" | "year" | false
  >(false);
  const initDate = useMemo(
    () => DateTime.fromJSDate(value || new Date()).setZone(timeZone),
    [value, timeZone],
  );

  const [month, setMonth] = useState<DateTime>(initDate);
  const [date, setDate] = useState<DateTime>(initDate);

  const endMonth = useMemo(() => {
    return month.plus({ years: 1 });
  }, [month]);

  const minDate = useMemo(
    () => (min ? DateTime.fromJSDate(min).setZone(timeZone) : undefined),
    [min, timeZone],
  );
  const maxDate = useMemo(
    () => (max ? DateTime.fromJSDate(max).setZone(timeZone) : undefined),
    [max, timeZone],
  );

  const onDayChanged = useCallback(
    (newDate: Date) => {
      const d = DateTime.fromJSDate(newDate).setZone(timeZone, {
        keepLocalTime: true,
      });
      let day = d.set({
        hour: date.hour,
        minute: date.minute,
        second: showSeconds ? date.second : 0,
      });
      if (minDate && d < minDate) {
        day = day.set({
          hour: minDate.hour,
          minute: minDate.minute,
          second: showSeconds ? minDate.second : 0,
        });
      }
      if (maxDate && d > maxDate) {
        day = day.set({
          hour: maxDate.hour,
          minute: maxDate.minute,
          second: showSeconds ? maxDate.second : 0,
        });
      }
      setDate(day);
      if (commitOnChange) onChange?.(day.toJSDate());
    },
    [setDate, onChange, commitOnChange, timeZone, date],
  );

  const onSubmit = useCallback(() => {
    onChange(date.toJSDate());
    setOpen(false);
  }, [date, onChange]);

  const onMonthYearChanged = useCallback(
    (d: DateTime, mode: "month" | "year") => {
      setMonth(d);
      if (mode === "year") {
        setMonthYearPicker("month");
      } else {
        setMonthYearPicker(false);
      }
    },
    [setMonth, setMonthYearPicker],
  );
  const onNextMonth = useCallback(() => {
    setMonth(month.plus({ months: 1 }));
  }, [month]);
  const onPrevMonth = useCallback(() => {
    setMonth(month.minus({ months: 1 }));
  }, [month]);

  useEffect(() => {
    if (open) {
      setDate(initDate);
      setMonth(initDate);
      setMonthYearPicker(false);
    }
  }, [open, initDate]);

  const displayValue = useMemo(() => {
    if (!open && !value) return value;
    return open ? date : initDate;
  }, [date, value, open]);

  const dislayFormat = useMemo(() => {
    if (!displayValue) return "Pick a date";
    const secondsFormat = showSeconds ? ":ss" : "";

    return displayValue.toFormat(
      `${!hideTime ? "MMM" : "MMMM"} d, yyyy${!hideTime ? (use12HourFormat ? ` hh:mm${secondsFormat} a` : ` HH:mm${secondsFormat}`) : ""}`,
      { locale },
    );
  }, [displayValue, hideTime, use12HourFormat, showSeconds, locale]);

  const onTimeChanged = useCallback(
    (date: Date) => {
      const d = DateTime.fromJSDate(date).setZone(timeZone, {
        keepLocalTime: true,
      });
      setDate(d);
      if (commitOnChange) onChange?.(d.toJSDate());
    },
    [setDate, commitOnChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        {renderTrigger ? (
          renderTrigger({
            value: displayValue?.toJSDate(),
            open,
            timeZone,
            disabled,
            use12HourFormat,
            setOpen,
          })
        ) : (
          <div
            className={cn(
              "flex w-full cursor-pointer items-center h-8 ps-3 pe-1 font-normal border border-input rounded-md text-base shadow-sm",
              !displayValue && "text-muted-foreground",
              (!clearable || !value) && "pe-3",
              disabled && "opacity-50 cursor-not-allowed",
              classNames?.trigger,
            )}
            tabIndex={0}
          >
            <div className="flex-grow flex items-center">
              <CalendarIcon className="mr-2 size-4" />
              {dislayFormat}
            </div>
            {clearable && value && (
              <Button
                disabled={disabled}
                variant="ghost"
                size="icon"
                role="button"
                aria-label="Clear date"
                className="size-6 p-1 ms-1"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange(undefined);
                  setOpen(false);
                }}
              >
                <X className="size-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-md font-bold ms-2 flex items-center cursor-pointer">
            <div>
              <span
                onClick={() =>
                  setMonthYearPicker(
                    monthYearPicker === "month" ? false : "month",
                  )
                }
              >
                {month.toFormat("MMMM", { locale })}
              </span>
              <span
                className="ms-1"
                onClick={() =>
                  setMonthYearPicker(
                    monthYearPicker === "year" ? false : "year",
                  )
                }
              >
                {month.toFormat("yyyy", { locale })}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setMonthYearPicker(monthYearPicker ? false : "year")
              }
            >
              {monthYearPicker ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </Button>
          </div>
          <div
            className={cn("flex space-x-2", monthYearPicker ? "hidden" : "")}
          >
            <Button variant="ghost" size="icon" onClick={onPrevMonth}>
              <ChevronLeftIcon />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNextMonth}>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
        <div className="relative overflow-hidden">
          <DayPicker
            timeZone={timeZone}
            mode="single"
            selected={date.toJSDate()}
            onSelect={(d) => d && onDayChanged(d)}
            month={month.toJSDate()}
            endMonth={endMonth.toJSDate()}
            disabled={
              disabledDays
                ? disabledDays
                : ([
                    max ? { after: max } : null,
                    min ? { before: min } : null,
                  ].filter(Boolean) as Matcher[])
            }
            onMonthChange={(d) => setMonth(DateTime.fromJSDate(d))}
            classNames={{
              dropdowns: "flex w-full gap-2",
              months: "flex w-full h-fit",
              month: "flex flex-col w-full",
              month_caption: "hidden",
              button_previous: "hidden",
              button_next: "hidden",
              month_grid: "w-full border-collapse",
              weekdays: "flex justify-between mt-2",
              weekday:
                "text-muted-foreground rounded-md w-9 font-normal text-[0.925rem]",
              week: "flex w-full justify-between mt-2",
              day: "h-9 w-9 text-center text-base p-0 relative flex items-center justify-center [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 rounded-1",
              day_button: cn(
                buttonVariants({ variant: "ghost" }),
                "size-9 rounded-md p-0 font-normal aria-selected:opacity-100",
              ),
              range_end: "day-range-end",
              selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-l-md rounded-r-md",
              today: "bg-accent text-accent-foreground",
              outside:
                "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              disabled: "text-muted-foreground opacity-50",
              range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              hidden: "invisible",
            }}
            showOutsideDays
            {...props}
          />
          <div
            className={cn(
              "absolute top-0 left-0 bottom-0 right-0",
              monthYearPicker ? "bg-popover" : "hidden",
            )}
          ></div>
          <MonthYearPicker
            value={month}
            mode={monthYearPicker as any}
            onChange={onMonthYearChanged}
            minDate={minDate}
            maxDate={maxDate}
            className={cn(
              "absolute top-0 left-0 bottom-0 right-0",
              monthYearPicker ? "" : "hidden",
            )}
            locale={locale}
          />
        </div>
        <div className="flex flex-col gap-2">
          {!hideTime && (
            <SimpleTimePicker
              value={date.toJSDate()}
              onChange={onTimeChanged}
              use12HourFormat={use12HourFormat}
              showSeconds={showSeconds}
              min={minDate?.toJSDate()}
              max={maxDate?.toJSDate()}
              minutesDivisibleBy={minutesDivisibleBy}
              timeZone={timeZone}
            />
          )}
          <div className="flex flex-row-reverse items-center justify-between">
            <Button className="ms-2 h-7 px-2" onClick={onSubmit}>
              Done
            </Button>
            {/* {timeZone && (
              <div className="text-base">
                <span>Timezone:</span>
                <span className="font-semibold ms-1">{timeZone}</span>
              </div>
            )} */}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TimeOption {
  value: number;
  label: string;
  disabled: boolean;
}

function MonthYearPicker({
  value,
  minDate,
  maxDate,
  mode = "month",
  onChange,
  className,
  locale,
}: {
  value: DateTime;
  mode: "month" | "year";
  minDate?: DateTime;
  maxDate?: DateTime;
  onChange: (value: DateTime, mode: "month" | "year") => void;
  className?: string;
  locale: string;
}) {
  const yearRef = useRef<HTMLDivElement>(null);
  const years = useMemo(() => {
    const years: TimeOption[] = [];
    for (let i = 1912; i < 2100; i++) {
      let disabled = false;
      const startY = value.set({ year: i }).startOf("year");
      const endY = value.set({ year: i }).endOf("year");

      if (minDate && endY < minDate) disabled = true;
      if (maxDate && startY > maxDate) disabled = true;
      years.push({ value: i, label: i.toString(), disabled });
    }
    return years;
  }, [value]);
  const months = useMemo(() => {
    const months: TimeOption[] = [];
    for (let i = 1; i <= 12; i++) {
      let disabled = false;
      const startM = value.set({ month: i }).startOf("month");
      const endM = value.set({ month: i }).endOf("month");

      if (minDate && endM < minDate) disabled = true;
      if (maxDate && startM > maxDate) disabled = true;

      months.push({
        value: i,
        label: DateTime.fromObject({ month: i }).toFormat("MMM", { locale }),
        disabled,
      });
    }
    return months;
  }, [value, locale]);

  const onYearChange = useCallback(
    (v: TimeOption) => {
      let newDate = value.set({ year: v.value });
      if (minDate && newDate < minDate) {
        newDate = newDate.set({ month: minDate.month });
      }
      if (maxDate && newDate > maxDate) {
        newDate = newDate.set({ month: maxDate.month });
      }

      onChange(newDate, "year");
    },
    [onChange, value, minDate, maxDate],
  );

  useEffect(() => {
    if (mode === "year") {
      yearRef.current?.scrollIntoView({ behavior: "auto", block: "center" });
    }
  }, [mode, value]);
  return (
    <div className={cn(className)}>
      <ScrollArea className="h-full">
        {mode === "year" && (
          <div className="grid grid-cols-4">
            {years.map((year) => (
              <div
                key={year.value}
                ref={year.value === value.year ? yearRef : undefined}
              >
                <Button
                  disabled={year.disabled}
                  variant={value.year === year.value ? "default" : "ghost"}
                  className="rounded-full"
                  onClick={() => onYearChange(year)}
                >
                  {year.label}
                </Button>
              </div>
            ))}
          </div>
        )}
        {mode === "month" && (
          <div className="grid grid-cols-3 gap-4">
            {months.map((month) => (
              <Button
                key={month.value}
                size="lg"
                disabled={month.disabled}
                variant={value.month === month.value ? "default" : "ghost"}
                className="rounded-full"
                onClick={() =>
                  onChange(value.set({ month: month.value }), "month")
                }
              >
                {month.label}
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
