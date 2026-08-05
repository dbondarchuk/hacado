"use client";

import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hacado/ui";
import { Minus, Plus } from "lucide-react";
import React from "react";

type RawNumberInputProps = {
  iconLabel: React.JSX.Element;
  step?: number;
  min?: number;
  max?: number;
  options: number[];
  float?: boolean;
  id?: string;
  disabled?: boolean;
  suffix?: React.ReactNode;
  disableNegative?: boolean;
} & (
  | {
      nullable?: false;
      value?: number;
      setValue: (v: number) => void;
    }
  | {
      nullable: true;
      value?: number | null;
      setValue: (v: number | null) => void;
    }
);

const isPartialNumber = (val: string, float?: boolean, allowNegative?: boolean) => {
  if (val === "") return true;
  if (allowNegative && val === "-") return true;
  if (float) {
    if (val === "." || (allowNegative && val === "-.")) return true;
    return /^-?\d*\.?\d*$/.test(val);
  }
  return /^-?\d*$/.test(val);
};

export const RawNumberInput: React.FC<RawNumberInputProps> = ({
  iconLabel,
  value,
  setValue,
  nullable,
  options,
  min,
  max,
  step = 1,
  float,
  id: propId,
  disabled,
  suffix,
  disableNegative,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value?.toString() ?? "");

  React.useEffect(() => {
    // Don't clobber in-progress edits (e.g. typing "-") while focused
    if (!isFocused) {
      setInputValue(value?.toString() ?? "");
    }
  }, [value, isFocused]);

  const handleInputChange = React.useCallback(
    (next: number | null) => {
      if (next === null && !nullable) return;
      if (
        next !== null &&
        ((typeof min !== "undefined" && next < min) ||
          (typeof max !== "undefined" && next > max))
      ) {
        if (nullable) setValue(null);
        return;
      }

      if (disableNegative && next !== null && next < 0) {
        setValue(0);
        return;
      }

      setValue(next as number);
    },
    [setValue, nullable, min, max, disableNegative],
  );

  const parseFn = (val: string) =>
    val.length === 0 || val === "-" || val === "." || val === "-."
      ? null
      : float
        ? parseFloat(val)
        : parseInt(val, 10);

  const commitInputValue = (raw: string) => {
    const parsed = parseFn(raw);
    if (parsed === null || Number.isNaN(parsed)) {
      if (parsed === null && nullable) {
        handleInputChange(null);
        setInputValue("");
        return;
      }
      // Incomplete draft ("-", ".") or invalid — restore committed value
      setInputValue(value?.toString() ?? "");
      return;
    }
    handleInputChange(parsed);
    setInputValue(parsed.toString());
  };

  const handleDeltaChange = (delta: number) => {
    const newSize = parseFloat(Number((value ?? 0) + delta).toFixed(10));
    handleInputChange(newSize);
  };

  const id = React.useId();
  const inputId = propId ?? id;

  return (
    <div className="flex flex-row gap-0.5 items-center grow w-full">
      <label className="min-w-6 shrink-0 cursor-pointer" htmlFor={inputId}>
        {iconLabel}
      </label>

      <div className="flex flex-row gap-0.5 items-center justify-center grow w-full">
        <Button
          onClick={() => handleDeltaChange(-step)}
          variant="ghost"
          size="sm"
          disabled={disabled}
        >
          <Minus className="" />
        </Button>

        <Popover open={isFocused} modal={false}>
          <PopoverTrigger asChild>
            <input
              className={cn(
                "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none h-8 min-w-10 max-w-12 shrink bg-transparent text-foreground px-1 text-center text-sm hover:bg-muted disabled:text-muted-foreground",
              )}
              value={inputValue}
              onBlur={(e) => {
                setIsFocused(false);
                commitInputValue(e.currentTarget.value);
              }}
              onChange={(e) => {
                const next = e.target.value;
                if (
                  !isPartialNumber(next, float, !disableNegative)
                ) {
                  return;
                }

                setInputValue(next);

                // Intermediate drafts like "-" / "." / "1." — keep local only
                if (
                  next === "" ||
                  next === "-" ||
                  next === "." ||
                  next === "-." ||
                  (float && next.endsWith("."))
                ) {
                  if (next === "" && nullable) {
                    handleInputChange(null);
                  }
                  return;
                }

                const parsed = parseFn(next);
                if (parsed !== null && !Number.isNaN(parsed)) {
                  handleInputChange(parsed);
                }
              }}
              onFocus={() => {
                setIsFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitInputValue(e.currentTarget.value);
                  setIsFocused(false);
                }
              }}
              data-plate-focus="true"
              type="text"
              inputMode={float ? "decimal" : "numeric"}
              id={inputId}
              disabled={disabled}
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-10 px-px py-1"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {options.map((option) => (
              <button
                key={option}
                className={cn(
                  "flex h-8 w-full items-center justify-center text-sm hover:bg-accent data-[highlighted=true]:bg-accent",
                )}
                onClick={() => {
                  handleInputChange(option);
                  setInputValue(option.toString());
                }}
                data-highlighted={option.toString() === value?.toString()}
                type="button"
              >
                {option}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <Button
          onClick={() => handleDeltaChange(step)}
          variant="ghost"
          size="sm"
          disabled={disabled}
        >
          <Plus className="" />
        </Button>
      </div>
      {suffix && (
        <label className="min-w-6 shrink-0 cursor-pointer" htmlFor={inputId}>
          {suffix}
        </label>
      )}
    </div>
  );
};
