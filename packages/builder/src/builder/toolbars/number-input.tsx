"use client";

import { Leaves } from "@hacado/types";
import {
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToolbarButton,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui";
import { destructAndReplace, resolveProperty } from "@hacado/utils";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { ConfigurationProps } from "../../documents/types";

export const NumberInputToolbarMenu = <T,>({
  defaultValue,
  property,
  data,
  setData,
  options,
  tooltip,
  min,
  max,
}: ConfigurationProps<T> & {
  defaultValue: number;
  property: Leaves<T>;
  tooltip: string;
  options: number[];
  min?: number;
  max?: number;
}) => {
  const propValue = resolveProperty(data, property) ?? defaultValue;
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (value: number) => {
    if (
      (typeof min !== "undefined" && value < min) ||
      (typeof max !== "undefined" && value > max)
    ) {
      return;
    }

    setData(destructAndReplace(data, property, value) as unknown as any);
  };

  const handleDeltaChange = (delta: number) => {
    const newSize = propValue + delta;
    handleInputChange(newSize);
  };

  return (
    <TooltipResponsive>
      <TooltipResponsiveTrigger>
        <div className="flex h-7 items-center gap-1 rounded-md bg-muted/60 p-0 mx-1">
          <ToolbarButton onClick={() => handleDeltaChange(-1)}>
            <Minus />
          </ToolbarButton>

          <Popover open={isFocused} modal={false}>
            <PopoverTrigger asChild>
              <input
                className={cn(
                  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none h-full w-10 shrink-0 bg-transparent text-foreground px-1 text-center text-sm hover:bg-muted",
                )}
                value={propValue}
                onBlur={() => {
                  setIsFocused(false);
                }}
                onChange={(e) =>
                  handleInputChange(parseInt(e.target.value) || 0)
                }
                onFocus={() => {
                  setIsFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInputChange(propValue);
                    setIsFocused(false);
                  }
                }}
                data-plate-focus="true"
                type="number"
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
                  }}
                  data-highlighted={option.toString() === propValue.toString()}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <ToolbarButton onClick={() => handleDeltaChange(1)}>
            <Plus />
          </ToolbarButton>
        </div>
      </TooltipResponsiveTrigger>
      <TooltipResponsiveContent>{tooltip}</TooltipResponsiveContent>
    </TooltipResponsive>
  );
};
