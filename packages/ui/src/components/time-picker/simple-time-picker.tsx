"use client";

import { useI18n } from "@timelish/i18n/client";
import { CheckIcon, ChevronDownIcon, Clock } from "lucide-react";
import { DateTime } from "luxon";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../utils";
import { Button } from "../button";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { ScrollArea } from "../scroll-area";

interface SimpleTimeOption {
  value: any;
  label: string;
  disabled?: boolean;
}

const AM_VALUE = 0;
const PM_VALUE = 1;

export function SimpleTimePicker({
  value: valueDateJs,
  onChange,
  use12HourFormat,
  min,
  max,
  disabled,
  modal,
  showSeconds = false,
  minutesDivisibleBy,
  timeZone,
}: {
  use12HourFormat?: boolean;
  value: Date;
  onChange: (date: Date) => void;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  className?: string;
  modal?: boolean;
  showSeconds?: boolean;
  minutesDivisibleBy?: number;
  timeZone?: string;
}) {
  const t = useI18n("ui");
  // hours24h = HH
  // hours12h = hh
  const formatStr = useMemo(
    () =>
      use12HourFormat
        ? "yyyy-MM-dd hh:mm:ss.SSS a xxxx"
        : "yyyy-MM-dd HH:mm:ss.SSS xxxx",
    [use12HourFormat],
  );

  const value = useMemo(
    () => DateTime.fromJSDate(valueDateJs).setZone(timeZone),
    [valueDateJs, timeZone],
  );

  const [ampm, setAmpm] = useState(
    value.toFormat("a") === "AM" ? AM_VALUE : PM_VALUE,
  );

  const minDate = useMemo(
    () => (min ? DateTime.fromJSDate(min).setZone(timeZone) : undefined),
    [min, timeZone],
  );
  const maxDate = useMemo(
    () => (max ? DateTime.fromJSDate(max).setZone(timeZone) : undefined),
    [max, timeZone],
  );

  const [hour, setHour] = useState(
    use12HourFormat ? +value.toFormat("hh") : value.hour,
  );
  const [minute, setMinute] = useState(value.minute);
  const [second, setSecond] = useState(value.second);

  useEffect(() => {
    onChange(
      buildTime({
        use12HourFormat,
        value,
        formatStr,
        hour,
        minute,
        second,
        ampm,
        showSeconds,
      }).toJSDate(),
    );
  }, [hour, minute, second, ampm, formatStr, use12HourFormat]);

  const _hourIn24h = useMemo(() => {
    return use12HourFormat ? (hour % 12) + ampm * 12 : hour;
  }, [hour, use12HourFormat, ampm]);

  const hours: SimpleTimeOption[] = useMemo(
    () =>
      Array.from({ length: use12HourFormat ? 12 : 24 }, (_, i) => {
        let disabled = false;
        const hourValue = use12HourFormat ? (i === 0 ? 12 : i) : i;
        const hDate = value.set({ hour: use12HourFormat ? i + ampm * 12 : i });
        const hStart = hDate.startOf("hour");
        const hEnd = hDate.endOf("hour");
        if (minDate && hEnd < minDate) disabled = true;
        if (maxDate && hStart > maxDate) disabled = true;
        return {
          value: hourValue,
          label: hourValue.toString().padStart(2, "0"),
          disabled,
        };
      }),
    [value, min, max, use12HourFormat, ampm],
  );
  const minutes: SimpleTimeOption[] = useMemo(() => {
    const anchorDate = value.set({ hour: _hourIn24h });
    return Array.from({ length: 60 }, (_, i) => {
      let disabled = false;
      const mDate = anchorDate.set({ minute: i });
      const mStart = mDate.startOf("minute");
      const mEnd = mDate.endOf("minute");
      if (minDate && mEnd < minDate) disabled = true;
      if (maxDate && mStart > maxDate) disabled = true;
      return {
        value: i,
        label: i.toString().padStart(2, "0"),
        disabled,
      };
    }).filter(
      (minute) =>
        !minutesDivisibleBy || minute.value % minutesDivisibleBy === 0,
    );
  }, [value, min, max, _hourIn24h]);

  const seconds: SimpleTimeOption[] = useMemo(() => {
    const anchorDate = value.set({
      hour: _hourIn24h,
      minute,
      second: 0,
      millisecond: 0,
    });

    const _min = minDate
      ? minDate.set({ second: 0, millisecond: 0 })
      : undefined;
    const _max = maxDate
      ? maxDate.set({ second: 0, millisecond: 0 })
      : undefined;

    return Array.from({ length: 60 }, (_, i) => {
      let disabled = false;
      const sDate = anchorDate.set({ second: i });
      if (_min && sDate < _min) disabled = true;
      if (_max && sDate > _max) disabled = true;
      return {
        value: i,
        label: i.toString().padStart(2, "0"),
        disabled,
      };
    });
  }, [value, minute, min, max, _hourIn24h]);
  const ampmOptions = useMemo(() => {
    const startD = value.startOf("day");
    const endD = value.endOf("day");
    return [
      { value: AM_VALUE, label: t("timePicker.am") },
      { value: PM_VALUE, label: t("timePicker.pm") },
    ].map((v) => {
      let disabled = false;
      const start = startD.plus({ hours: v.value * 12 });
      const end = endD.minus({ hours: (1 - v.value) * 12 });
      if (minDate && end < minDate) disabled = true;
      if (maxDate && start > maxDate) disabled = true;
      return { ...v, disabled };
    });
  }, [value, min, max]);

  const [open, setOpen] = useState(false);

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (open) {
        hourRef.current?.scrollIntoView({ behavior: "auto" });
        minuteRef.current?.scrollIntoView({ behavior: "auto" });
        secondRef.current?.scrollIntoView({ behavior: "auto" });
      }
    }, 1);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const onHourChange = useCallback(
    (v: SimpleTimeOption) => {
      if (minDate) {
        let newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour: v.value,
          minute,
          second,
          ampm,
        });
        if (newTime < minDate) {
          setMinute(minDate.minute);
          setSecond(minDate.second);
        }
      }
      if (maxDate) {
        let newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour: v.value,
          minute,
          second,
          ampm,
        });
        if (newTime > maxDate) {
          setMinute(maxDate.minute);
          setSecond(maxDate.second);
        }
      }
      setHour(v.value);
    },
    [setHour, use12HourFormat, value, formatStr, minute, second, ampm],
  );

  const onMinuteChange = useCallback(
    (v: SimpleTimeOption) => {
      if (minDate) {
        let newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour: v.value,
          minute,
          second,
          ampm,
        });
        if (newTime < minDate) {
          setSecond(minDate.second);
        }
      }
      if (maxDate) {
        let newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour: v.value,
          minute,
          second,
          ampm,
        });
        if (newTime > maxDate) {
          setSecond(newTime.second);
        }
      }
      setMinute(v.value);
    },
    [setMinute, use12HourFormat, value, formatStr, hour, second, ampm],
  );

  const onAmpmChange = useCallback(
    (v: SimpleTimeOption) => {
      if (minDate) {
        let newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour,
          minute,
          second,
          ampm: v.value,
        });
        if (newTime < minDate) {
          const minH = minDate.hour % 12;
          setHour(minH === 0 ? 12 : minH);
          setMinute(minDate.minute);
          setSecond(minDate.second);
        }
      }
      if (maxDate) {
        let newTime = buildTime({
          use12HourFormat,
          value,
          formatStr,
          hour,
          minute,
          second,
          ampm: v.value,
        });
        if (newTime > maxDate) {
          const maxH = maxDate.hour % 12;
          setHour(maxH === 0 ? 12 : maxH);
          setMinute(maxDate.minute);
          setSecond(maxDate.second);
        }
      }
      setAmpm(v.value);
    },
    [
      setAmpm,
      use12HourFormat,
      value,
      formatStr,
      hour,
      minute,
      second,
      min,
      max,
    ],
  );

  const secondsFormat = useMemo(
    () => (showSeconds ? ":ss" : ""),
    [showSeconds],
  );
  const display = useMemo(() => {
    return value.toFormat(
      use12HourFormat ? `hh:mm${secondsFormat} a` : `HH:mm${secondsFormat}`,
    );
  }, [value, use12HourFormat, secondsFormat]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-8 px-3 items-center justify-between cursor-pointer font-normal border border-input rounded-md text-base shadow-sm",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          tabIndex={0}
        >
          <Clock className="mr-2 size-4" />
          {display}
          <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0" side="top">
        <div className="flex-col gap-2 p-2">
          <div className="flex h-56 grow">
            <ScrollArea className="h-full flex-grow">
              <div className="flex grow flex-col items-stretch overflow-y-auto pe-2 pb-48">
                {hours.map((v) => (
                  <div
                    ref={v.value === hour ? hourRef : undefined}
                    key={v.value}
                  >
                    <TimeItem
                      option={v}
                      selected={v.value === hour}
                      onSelect={onHourChange}
                      disabled={v.disabled}
                      className="h-8"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className="h-full flex-grow">
              <div className="flex grow flex-col items-stretch overflow-y-auto pe-2 pb-48">
                {minutes.map((v) => (
                  <div
                    ref={v.value === minute ? minuteRef : undefined}
                    key={v.value}
                  >
                    <TimeItem
                      option={v}
                      selected={v.value === minute}
                      onSelect={onMinuteChange}
                      disabled={v.disabled}
                      className="h-8"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
            {showSeconds && (
              <ScrollArea className="h-full flex-grow">
                <div className="flex grow flex-col items-stretch overflow-y-auto pe-2 pb-48">
                  {seconds.map((v) => (
                    <div
                      ref={v.value === second ? secondRef : undefined}
                      key={v.value}
                    >
                      <TimeItem
                        option={v}
                        selected={v.value === second}
                        onSelect={(v) => setSecond(v.value)}
                        className="h-8"
                        disabled={v.disabled}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            {use12HourFormat && (
              <ScrollArea className="h-full flex-grow">
                <div className="flex grow flex-col items-stretch overflow-y-auto pe-2">
                  {ampmOptions.map((v) => (
                    <TimeItem
                      key={v.value}
                      option={v}
                      selected={v.value === ampm}
                      onSelect={onAmpmChange}
                      className="h-8"
                      disabled={v.disabled}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const TimeItem = ({
  option,
  selected,
  onSelect,
  className,
  disabled,
}: {
  option: SimpleTimeOption;
  selected: boolean;
  onSelect: (option: SimpleTimeOption) => void;
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <Button
      variant="ghost"
      className={cn("flex justify-center px-1 pe-2 ps-1", className)}
      onClick={() => onSelect(option)}
      disabled={disabled}
    >
      <div className="w-4">
        {selected && <CheckIcon className="my-auto size-4" />}
      </div>
      <span className="ms-2">{option.label}</span>
    </Button>
  );
};

interface BuildTimeOptions {
  use12HourFormat?: boolean;
  value: DateTime;
  formatStr: string;
  hour: number;
  minute: number;
  second: number;
  ampm: number;
  showSeconds?: boolean;
}

function buildTime(options: BuildTimeOptions) {
  const {
    use12HourFormat,
    value,
    formatStr,
    hour,
    minute,
    second,
    ampm,
    showSeconds,
  } = options;

  let date: DateTime;
  if (use12HourFormat) {
    const dateStrRaw = value.toFormat(formatStr);
    // yyyy-MM-dd hh:mm:ss.SSS a zzzz
    // 2024-10-14 01:20:07.524 AM GMT+00:00
    let dateStr =
      dateStrRaw.slice(0, 11) +
      hour.toString().padStart(2, "0") +
      dateStrRaw.slice(13);
    dateStr =
      dateStr.slice(0, 14) +
      minute.toString().padStart(2, "0") +
      dateStr.slice(16);
    dateStr =
      dateStr.slice(0, 17) +
      second.toString().padStart(2, "0") +
      dateStr.slice(19);
    dateStr =
      dateStr.slice(0, 24) +
      (ampm == AM_VALUE ? "AM" : "PM") +
      dateStr.slice(26);
    date = DateTime.fromFormat(dateStr, formatStr);
  } else {
    date = value.set({
      hour,
      minute,
      second: showSeconds ? second : 0,
      millisecond: 0,
    });
  }
  return date;
}
