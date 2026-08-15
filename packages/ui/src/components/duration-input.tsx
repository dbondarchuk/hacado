import { useI18n } from "@hacado/i18n/client";
import { durationToTime, timeToDuration, weeks } from "@hacado/utils";
import { Clock } from "lucide-react";
import React from "react";
import { cn } from "../utils/cn";
import { Input, InputProps } from "./input";

export type DurationInputProps = Omit<
  InputProps,
  "type" | "value" | "onChange" | "placeholder" | "min" | "max"
> & {
  value?: number | null;
  onChange?: (value: number | null) => void;
  inputClassName?: string;
  placeholderHours?: string;
  placeholderMinutes?: string;
  placeholderWeeks?: string;
  placeholderDays?: string;
  type?: "hours-minutes" | "minutes-seconds" | "weeks-days-hours-minutes";
};

const sizes: Record<NonNullable<InputProps["h"]>, string> = {
  lg: "py-2",
  md: "py-1",
  sm: "py-1",
  xs: "py-1",
};

export const DurationInput: React.FC<DurationInputProps> = ({
  value,
  onChange,
  className,
  inputClassName,
  placeholderHours,
  placeholderMinutes,
  placeholderWeeks,
  placeholderDays,
  name,
  type = "hours-minutes",
  itemRef: _,
  ...rest
}) => {
  const t = useI18n("ui");
  const duration = value
    ? type === "weeks-days-hours-minutes"
      ? weeks.durationToTime(value)
      : (durationToTime(value) as ReturnType<typeof weeks.durationToTime>)
    : undefined;

  const minutesRef = React.useRef<HTMLInputElement>(null);
  const hoursRef = React.useRef<HTMLInputElement>(null);
  const daysRef = React.useRef<HTMLInputElement>(null);
  const weeksRef = React.useRef<HTMLInputElement>(null);

  const onWeeksChange = (v?: string) => {
    const value = parseInt(v as string) ?? undefined;
    onChange?.(
      weeks.timeToDuration(
        !duration?.minutes && !value && !duration?.days && !duration?.hours
          ? null
          : {
              weeks: value || 0,
              minutes: duration?.minutes || 0,
              days: duration?.days || 0,
              hours: duration?.hours || 0,
            },
      ) ?? null,
    );
  };

  const onDaysChange = (v?: string) => {
    const value = parseInt(v as string) ?? undefined;
    onChange?.(
      weeks.timeToDuration(
        !duration?.minutes && !value && !duration?.weeks && !duration?.hours
          ? null
          : {
              weeks: duration?.weeks || 0,
              minutes: duration?.minutes || 0,
              days: value || 0,
              hours: duration?.hours || 0,
            },
      ) ?? null,
    );
  };

  const onHoursChange = (v?: string) => {
    const value = parseInt(v as string) ?? undefined;
    onChange?.(
      type === "weeks-days-hours-minutes"
        ? (weeks.timeToDuration(
            !duration?.minutes && !value && !duration?.days && !duration?.weeks
              ? null
              : {
                  hours: value || 0,
                  minutes: duration?.minutes || 0,
                  days: duration?.days || 0,
                  weeks: duration?.weeks || 0,
                },
          ) ?? null)
        : (timeToDuration(
            !duration?.minutes && !value
              ? null
              : {
                  hours: value || 0,
                  minutes: duration?.minutes || 0,
                },
          ) ?? null),
    );
  };

  const onMinutesChange = (v?: string) => {
    const value = parseInt(v as string) ?? undefined;
    onChange?.(
      type === "weeks-days-hours-minutes"
        ? (weeks.timeToDuration(
            !duration?.hours && !value && !duration?.days && !duration?.weeks
              ? null
              : {
                  minutes: value || 0,
                  hours: duration?.hours || 0,
                  days: duration?.days || 0,
                  weeks: duration?.weeks || 0,
                },
          ) ?? null)
        : (timeToDuration(
            !duration?.hours && !value
              ? null
              : {
                  minutes: value || 0,
                  hours: duration?.hours || 0,
                },
          ) ?? null),
    );
  };

  const handleWeeksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");

    if (value.length > 2) return;

    onWeeksChange(value);

    // Auto-advance to days when 2 digits are entered
    if (value.length === 2 && daysRef.current) {
      daysRef.current.focus();
    }
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");

    if (value.length > 1) return;

    onDaysChange(value);
    // Auto-advance to hours when 1 digits are entered
    if (hoursRef.current) {
      hoursRef.current.focus();
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");

    if (value.length > 2) return;

    onHoursChange(value);

    // Auto-advance to minutes when 2 digits are entered
    if (value.length === 2 && minutesRef.current) {
      minutesRef.current.focus();
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");

    if (value.length > 2) return;

    // Ensure minutes are between 0-59
    if (
      value === "" ||
      (Number.parseInt(value) >= 0 && Number.parseInt(value) < 60)
    ) {
      onMinutesChange(value);
    }
  };

  const incrementValue = (
    value: string,
    max: number,
    setFunction: (value: string) => void,
  ) => {
    const numValue = value === "" ? 0 : Number.parseInt(value, 10);
    setFunction(((numValue + 1) % max).toString().padStart(2, "0"));
  };

  const decrementValue = (
    value: string,
    max: number,
    setFunction: (value: string) => void,
  ) => {
    const numValue = value === "" ? 0 : Number.parseInt(value, 10);
    setFunction(((numValue - 1 + max) % max).toString().padStart(2, "0"));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "hours" | "minutes" | "weeks" | "days",
  ) => {
    switch (e.key) {
      case "ArrowRight":
        if (
          field === "hours" &&
          minutesRef.current &&
          (!e.currentTarget.value?.length ||
            (e.currentTarget.selectionStart ?? 0) > 0)
        ) {
          minutesRef.current.focus();
        } else if (
          field === "weeks" &&
          daysRef.current &&
          (!e.currentTarget.value?.length ||
            (e.currentTarget.selectionStart ?? 0) > 0)
        ) {
          daysRef.current.focus();
        } else if (
          field === "days" &&
          hoursRef.current &&
          (!e.currentTarget.value?.length ||
            (e.currentTarget.selectionStart ?? 0) > 0)
        ) {
          hoursRef.current.focus();
        }
        break;
      case "ArrowLeft":
        if (
          field === "minutes" &&
          hoursRef.current &&
          (e.currentTarget.selectionStart ?? 0) === 0
        ) {
          hoursRef.current.focus();
        } else if (
          field === "hours" &&
          type === "weeks-days-hours-minutes" &&
          daysRef.current &&
          (e.currentTarget.selectionStart ?? 0) === 0
        ) {
          daysRef.current.focus();
        } else if (
          field === "days" &&
          type === "weeks-days-hours-minutes" &&
          weeksRef.current &&
          (e.currentTarget.selectionStart ?? 0) === 0
        ) {
          weeksRef.current.focus();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (field === "hours") {
          incrementValue(e.currentTarget.value, 24, onHoursChange);
        } else if (field === "weeks") {
          incrementValue(e.currentTarget.value, 52, onWeeksChange);
        } else if (field === "days") {
          incrementValue(e.currentTarget.value, 365, onDaysChange);
        } else {
          incrementValue(e.currentTarget.value, 60, onMinutesChange);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (field === "hours") {
          decrementValue(e.currentTarget.value, 24, onHoursChange);
        } else if (field === "weeks") {
          decrementValue(e.currentTarget.value, 52, onWeeksChange);
        } else if (field === "days") {
          decrementValue(e.currentTarget.value, 365, onDaysChange);
        } else {
          decrementValue(e.currentTarget.value, 60, onMinutesChange);
        }
        break;
      case "Backspace":
        if (
          field === "minutes" &&
          e.currentTarget.value === "" &&
          hoursRef.current
        ) {
          hoursRef.current.focus();
        } else if (
          field === "hours" &&
          type === "weeks-days-hours-minutes" &&
          e.currentTarget.value === "" &&
          daysRef.current
        ) {
          daysRef.current.focus();
        } else if (
          field === "days" &&
          type === "weeks-days-hours-minutes" &&
          e.currentTarget.value === "" &&
          weeksRef.current
        ) {
          weeksRef.current.focus();
        }

        break;
    }
  };

  const firstPartName = type !== "minutes-seconds" ? "hours" : "minutes";
  const secondPartName = type !== "minutes-seconds" ? "minutes" : "seconds";
  const firstPartLabel =
    type !== "minutes-seconds" ? t("common.hours") : t("common.minutes");
  const firstPartShortLabel =
    type !== "minutes-seconds" ? t("durationInput.hr") : t("durationInput.min");
  const secondPartLabel =
    type !== "minutes-seconds" ? t("common.minutes") : t("common.seconds");
  const secondPartShortLabel =
    type !== "minutes-seconds"
      ? t("durationInput.min")
      : t("durationInput.sec");

  const size = rest.h ? sizes[rest.h] : sizes.md;
  // const size = rest.h ? sizes[rest.h] : sizes.sm;

  return (
    <div className="flex items-center bg-background border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <div className="flex items-center pl-3 text-muted-foreground">
        <Clock className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 px-1">
        {type === "weeks-days-hours-minutes" && (
          <>
            <Input
              type="text"
              inputMode="numeric"
              placeholder={placeholderWeeks || "0"}
              min={0}
              value={duration?.weeks}
              onChange={handleWeeksChange}
              variant="ghost"
              className="w-4 sm:w-12 border-0 bg-transparent py-2 px-0 text-center focus:outline-none focus:ring-0"
              aria-label={t("durationInput.weeks")}
              name={name ? `${name}.weeks` : "weeks"}
              onKeyDown={(e) => handleKeyDown(e, "weeks")}
              {...rest}
              ref={weeksRef}
            />
            <span className={cn("text-muted-foreground h-8", size)}>
              {t("durationInput.weeks")}
            </span>
            <span className={cn("font-medium px-0.5", size)}>&nbsp;</span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder={placeholderDays || "0"}
              value={duration?.days}
              onChange={handleDaysChange}
              onKeyDown={(e) => handleKeyDown(e, "days")}
              min={0}
              max={6}
              variant="ghost"
              className="w-4 sm:w-12 border-0 bg-transparent py-2 px-0 text-center focus:outline-none focus:ring-0"
              aria-label={t("durationInput.days")}
              name={name ? `${name}.days` : "days"}
              {...rest}
              ref={daysRef}
            />
            <span className={cn("text-muted-foreground h-8", size)}>
              {t("durationInput.days")}
            </span>
          </>
        )}
        <Input
          type="text"
          inputMode="numeric"
          placeholder={placeholderHours || "00"}
          min={0}
          value={duration?.hours}
          onChange={handleHoursChange}
          variant="ghost"
          className="w-4 sm:w-12 border-0 bg-transparent py-2 px-0 text-center focus:outline-none focus:ring-0"
          aria-label={firstPartLabel}
          name={name ? `${name}.${firstPartName}` : firstPartName}
          onKeyDown={(e) => handleKeyDown(e, "hours")}
          {...rest}
          ref={hoursRef}
        />
        <span className={cn("text-muted-foreground h-8", size)}>
          {firstPartShortLabel}
        </span>
        <span className={cn("font-medium px-0.5", size)}>:</span>
        <Input
          type="text"
          inputMode="numeric"
          placeholder={placeholderMinutes || "00"}
          value={duration?.minutes?.toString()}
          onChange={handleMinutesChange}
          onKeyDown={(e) => handleKeyDown(e, "minutes")}
          min={0}
          max={59}
          variant="ghost"
          className="w-4 sm:w-12 border-0 bg-transparent py-2 px-0 text-center focus:outline-none focus:ring-0"
          aria-label={secondPartLabel}
          name={name ? `${name}.${secondPartName}` : secondPartName}
          {...rest}
          ref={minutesRef}
        />
        <span className={cn("text-muted-foreground h-8", size)}>
          {secondPartShortLabel}
        </span>
      </div>
    </div>
  );
};
