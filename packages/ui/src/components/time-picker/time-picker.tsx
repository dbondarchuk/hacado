"use client";

import { useI18n } from "@hacado/i18n/client";
import React from "react";
import { Label } from "../label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { TimePickerInput } from "./time-picker-input";
import {
  getDateByType,
  getDatePeriod,
  Period,
  setDateByType,
} from "./time-picker-utils";

interface TimePickerDemoProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  seconds?: boolean;
}

export function TimePicker({
  date = new Date(new Date().setHours(0, 0, 0, 0)),
  setDate,
  seconds = false,
}: TimePickerDemoProps) {
  const t = useI18n("ui");
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const secondRef = React.useRef<HTMLInputElement>(null);

  const onDateChange = (date: Date | undefined) => {
    if (seconds || !date) setDate(date);
    else setDate(setDateByType(date, "0", "seconds"));
  };

  const [period, setPeriod] = React.useState(getDatePeriod(date));
  React.useEffect(() => {
    setPeriod(getDatePeriod(date));
  }, [date]);

  const onPeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    const hours = getDateByType(date, "12hours");
    onDateChange(setDateByType(date, hours, "12hours", newPeriod));
  };

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-sm">
          {t("common.hours")}
        </Label>
        <TimePickerInput
          picker="12hours"
          date={date}
          setDate={onDateChange}
          ref={hourRef}
          period={period}
          onRightFocus={() => minuteRef.current?.focus()}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-sm">
          {t("common.minutes")}
        </Label>
        <TimePickerInput
          picker="minutes"
          date={date}
          setDate={onDateChange}
          ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          onRightFocus={() => secondRef.current?.focus()}
        />
      </div>
      {seconds && (
        <div className="grid gap-1 text-center">
          <Label htmlFor="seconds" className="text-sm">
            {t("timePicker.seconds")}
          </Label>
          <TimePickerInput
            picker="seconds"
            date={date}
            setDate={onDateChange}
            ref={secondRef}
            onLeftFocus={() => minuteRef.current?.focus()}
          />
        </div>
      )}
      {/* <div className="flex h-9 items-center">
        <Clock className="ml-2 h-4 w-4" />
      </div> */}
      <div className="grid gap-1 text-center">
        <Label htmlFor="period" className="text-sm"></Label>
        <Select
          onValueChange={(value: Period) => onPeriodChange(value)}
          value={period}
        >
          <SelectTrigger className="w-16">
            <SelectValue placeholder={t("timePicker.am")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">{t("timePicker.am")}</SelectItem>
            <SelectItem value="PM">{t("timePicker.pm")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
