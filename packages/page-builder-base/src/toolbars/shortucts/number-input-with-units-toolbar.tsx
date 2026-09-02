"use client";

import { AllKeys, useI18n } from "@hacado/i18n/client";
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToolbarButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useOpenState,
} from "@hacado/ui";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { ShortcutWithNumberWithUnit } from "../../shortcuts";
import {
  baseUnitConfigs,
  formatUnitLabel,
  selectValueToUnit,
  unitAllowsDecimals,
  unitToSelectValue,
} from "../../style-inputs/base/raw-number-input-with-units";
import { BaseStyleDictionary } from "../../style/types";
import {
  NumberValueWithUnitOrUnitless,
  UnitOrUnitless,
  units,
} from "../../style/zod";

export interface NumberWithUnitShortcutToolbarItem {
  shortcut: ShortcutWithNumberWithUnit<BaseStyleDictionary>;
  currentNumericValue: NumberValueWithUnitOrUnitless | null;
  onValueChange: (value: NumberValueWithUnitOrUnitless) => void;
  tooltip: AllKeys;
}

export const NumberInputWithUnitsToolbarMenu = ({
  shortcut,
  data: currentNumericValue,
  setData,
}: {
  shortcut: NumberWithUnitShortcutToolbarItem;
  data: NumberValueWithUnitOrUnitless | null;
  setData: (value: NumberValueWithUnitOrUnitless) => void;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const openState = useOpenState();
  const t = useI18n();

  const config = shortcut.shortcut.numberWithUnitConfig;
  const availableUnits = (config?.allowedUnits ??
    units) as readonly UnitOrUnitless[];
  const activeUnit = currentNumericValue?.unit ?? "rem";

  const handleValueChange = (value: NumberValueWithUnitOrUnitless | null) => {
    if (value) {
      setData(value);
    }
  };

  const currentStep =
    config?.step?.[activeUnit] ??
    config?.step?.base ??
    baseUnitConfigs.step[activeUnit] ??
    baseUnitConfigs.step.base;
  const currentMin =
    config?.min?.[activeUnit] ??
    config?.min?.base ??
    baseUnitConfigs.min[activeUnit] ??
    baseUnitConfigs.min.base;
  const currentMax =
    config?.max?.[activeUnit] ??
    config?.max?.base ??
    baseUnitConfigs.max[activeUnit] ??
    baseUnitConfigs.max.base;
  const currentOptions = [
    ...(config?.options?.[activeUnit] ??
      config?.options?.base ??
      baseUnitConfigs.options[activeUnit] ??
      baseUnitConfigs.options.base),
  ];

  const parseFn = (val: string) =>
    val.length === 0
      ? null
      : unitAllowsDecimals(activeUnit)
        ? parseFloat(val)
        : parseInt(val);

  const handleInputChange = (value: number | null) => {
    if (value === null) return;
    if (typeof currentMin !== "undefined" && value < currentMin) {
      handleValueChange({
        value: currentMin,
        unit: activeUnit,
      });
    } else if (typeof currentMax !== "undefined" && value > currentMax) {
      handleValueChange({
        value: currentMax,
        unit: activeUnit,
      });
    } else {
      handleValueChange({ value, unit: activeUnit });
    }
  };

  const handleDeltaChange = (delta: number) => {
    const newSize = parseFloat(
      Number((currentNumericValue?.value ?? 0) + delta).toFixed(10),
    );
    handleInputChange(newSize);
  };

  const handleUnitChange = (unit: UnitOrUnitless) => {
    handleValueChange({ value: currentNumericValue?.value ?? 0, unit });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex h-7 items-center gap-1 rounded-md bg-muted/60 p-0 mx-1">
          <ToolbarButton onClick={() => handleDeltaChange(-currentStep)}>
            <Minus />
          </ToolbarButton>

          <Popover open={isFocused} modal={false}>
            <PopoverTrigger asChild>
              <input
                className={cn(
                  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none h-full w-10 shrink-0 bg-transparent text-foreground px-1 text-center text-sm hover:bg-muted",
                )}
                value={currentNumericValue?.value ?? ""}
                onBlur={() => {
                  setIsFocused(false);
                }}
                onChange={(e) =>
                  handleInputChange(parseFn(e.target.value) || 0)
                }
                onFocus={() => {
                  setIsFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInputChange(currentNumericValue?.value ?? null);
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
              {currentOptions.map((option) => (
                <button
                  key={option}
                  className={cn(
                    "flex h-8 w-full items-center justify-center text-sm hover:bg-accent data-[highlighted=true]:bg-accent",
                  )}
                  onClick={() => {
                    handleInputChange(option);
                  }}
                  data-highlighted={
                    option.toString() === currentNumericValue?.value?.toString()
                  }
                  type="button"
                >
                  {option}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <DropdownMenu modal={false} {...openState}>
            <DropdownMenuTrigger asChild>
              <ToolbarButton
                pressed={openState.open}
                tooltip={t(shortcut.tooltip)}
                isDropdown
                className="text-xs"
              >
                {formatUnitLabel(activeUnit)}
              </ToolbarButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="min-w-0" align="start">
              <DropdownMenuRadioGroup
                value={unitToSelectValue(activeUnit)}
                onValueChange={(unit) =>
                  handleUnitChange(selectValueToUnit(unit))
                }
              >
                {availableUnits.map((unit) => (
                  <DropdownMenuRadioItem
                    key={unitToSelectValue(unit)}
                    value={unitToSelectValue(unit)}
                    className="min-w-[20px] text-xs"
                  >
                    {formatUnitLabel(unit)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <ToolbarButton onClick={() => handleDeltaChange(currentStep)}>
            <Plus />
          </ToolbarButton>
        </div>
      </TooltipTrigger>
      <TooltipContent>{t(shortcut.tooltip)}</TooltipContent>
    </Tooltip>
  );
};

/**
 * Creates a specialized toolbar item for number-with-unit shortcuts
 */
export const createNumberWithUnitToolbarItem = <T extends BaseStyleDictionary>(
  shortcut: ShortcutWithNumberWithUnit<T>,
  data: any,
  setData: (data: any) => void,
): NumberWithUnitShortcutToolbarItem => {
  // Get current numeric value from the target style
  const currentStyle = data.style?.[shortcut.targetStyle]?.find(
    (s: any) => !s.breakpoint?.length && !s.state?.length,
  );

  const currentNumericValue: NumberValueWithUnitOrUnitless | null =
    currentStyle?.value &&
    typeof currentStyle.value === "object" &&
    "value" in currentStyle.value &&
    "unit" in currentStyle.value
      ? (currentStyle.value as NumberValueWithUnitOrUnitless)
      : null;

  // Apply number-with-unit value change
  const applyNumberWithUnitValue = (value: NumberValueWithUnitOrUnitless) => {
    const newData = { ...data };
    const newStyles = { ...newData.style };

    if (newStyles[shortcut.targetStyle]) {
      // Update existing style variants
      const currentVariants = newStyles[shortcut.targetStyle];
      if (currentVariants && currentVariants.length > 0) {
        const updatedVariants = currentVariants.map((variant: any) => ({
          ...variant,
          value,
        }));
        newStyles[shortcut.targetStyle] = updatedVariants;
      }
    } else {
      // Create new style variant
      newStyles[shortcut.targetStyle] = [
        {
          breakpoint: [],
          state: [],
          value,
        },
      ];
    }

    newData.style = newStyles;
    setData(newData);
  };

  return {
    shortcut: shortcut as ShortcutWithNumberWithUnit<BaseStyleDictionary>,
    currentNumericValue,
    onValueChange: applyNumberWithUnitValue,
    tooltip: shortcut.label,
  };
};
