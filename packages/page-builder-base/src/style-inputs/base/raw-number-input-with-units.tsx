"use client";

import React, { useCallback } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hacado/ui";
import { NumberValueWithUnit, Unit, units } from "../../style/zod";
import { RawNumberInput } from "./raw-number-input";

// Base configurations for different units
export const baseUnitConfigs = {
  step: {
    base: 1,
    px: 1,
    rem: 0.1,
    "%": 1,
    vh: 1,
    vw: 1,
  },
  min: {
    base: 0,
    px: 0,
    rem: 0,
    "%": 0,
    vh: 0,
    vw: 0,
  },
  max: {
    base: undefined,
    px: undefined,
    rem: 100,
    "%": 100,
    vh: 100,
    vw: 100,
  },
  options: {
    base: [
      0, 1, 2, 4, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64, 128, 256, 512,
    ],
    px: [0, 1, 2, 4, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64, 128, 256, 512],
    rem: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8],
    "%": [0, 25, 50, 75, 100],
    vh: [0, 25, 50, 75, 100],
    vw: [0, 25, 50, 75, 100],
  },
} as const;

export type RawNumberInputWithUnitsProps = {
  icon: React.JSX.Element;
  min?: Partial<Record<Unit, number>> & { base?: number };
  max?: Partial<Record<Unit, number>> & { base?: number };
  noMax?: boolean;
  noMin?: boolean;
  allowNegative?: boolean;
  step?: Partial<Record<Unit, number>> & { base?: number };
  options?: Partial<Record<Unit, number[]>> & { base?: number[] };
  forceUnit?: Unit;
  id?: string;
} & (
  | {
      nullable?: false;
      defaultValue: NumberValueWithUnit;
      onChange: (v: NumberValueWithUnit) => void;
    }
  | {
      nullable: true;
      defaultValue?: NumberValueWithUnit | null;
      onChange: (v: NumberValueWithUnit | null) => void;
    }
);

export const RawNumberInputWithUnit: React.FC<RawNumberInputWithUnitsProps> = ({
  icon,
  defaultValue,
  onChange,
  min,
  max,
  noMax,
  noMin,
  allowNegative,
  options,
  step = {},
  nullable,
  forceUnit,
  id,
}) => {
  const [value, setValue] = React.useState(defaultValue?.value ?? null);
  React.useEffect(() => {
    setValue(defaultValue?.value ?? null);
  }, [defaultValue, setValue]);

  const [unit, setUnit] = React.useState(
    defaultValue?.unit ?? forceUnit ?? "px",
  );
  React.useEffect(() => {
    setUnit(defaultValue?.unit ?? forceUnit ?? "px");
  }, [defaultValue, setUnit]);

  // Get current unit values with fallbacks to base configs
  const currentStep =
    step[unit] ??
    step.base ??
    baseUnitConfigs.step[unit] ??
    baseUnitConfigs.step.base;
  const currentMin = noMin
    ? allowNegative
      ? undefined
      : 0
    : (min?.[unit] ??
      min?.base ??
      baseUnitConfigs.min[unit] ??
      baseUnitConfigs.min.base);
  const currentMax = noMax
    ? undefined
    : (max?.[unit] ??
      max?.base ??
      baseUnitConfigs.max[unit] ??
      baseUnitConfigs.max.base);
  const currentOptions = [
    ...(options?.[unit] ??
      options?.base ??
      baseUnitConfigs.options[unit] ??
      baseUnitConfigs.options.base),
  ];

  const handleValueChange = useCallback(
    (value: number | null) => {
      const val: NumberValueWithUnit | null =
        value === null
          ? null
          : {
              unit,
              value,
            };

      setValue(value);
      onChange(val as NumberValueWithUnit);
    },
    [onChange, unit],
  );

  const handleUnitChange = useCallback(
    (unit: Unit) => {
      const val: NumberValueWithUnit | null =
        value === null
          ? null
          : {
              unit,
              value,
            };

      setUnit(unit);
      onChange(val as NumberValueWithUnit);
    },
    [onChange, value],
  );

  return (
    <div className="flex flex-row gap-1 w-full justify-between">
      <RawNumberInput
        iconLabel={icon}
        value={value as any}
        setValue={handleValueChange}
        min={currentMin}
        max={currentMax}
        options={currentOptions}
        float={unit === "rem"}
        nullable={nullable}
        step={currentStep}
        disableNegative={!allowNegative}
        id={id}
      />
      <Select value={unit} onValueChange={handleUnitChange}>
        <SelectTrigger
          className="w-min"
          size="sm"
          disabled={forceUnit !== undefined}
        >
          <SelectValue placeholder="Select unit" />
        </SelectTrigger>
        <SelectContent>
          {units.map((u) => (
            <SelectItem key={u} value={u}>
              {u}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* <ResetButton onClick={handleChange} /> */}
    </div>
  );
};
