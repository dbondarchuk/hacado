"use client";

import React, { useCallback } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hacado/ui";
import { UNITLESS_UNIT, Unit, UnitOrUnitless, units } from "../../style/zod";
import { RawNumberInput } from "./raw-number-input";

/** Radix Select cannot use an empty string as an item value. */
export const UNITLESS_SELECT_VALUE = "unitless";

export const formatUnitLabel = (unit: string) =>
  unit === UNITLESS_UNIT ? "—" : unit;

export const unitToSelectValue = (unit: UnitOrUnitless) =>
  unit === UNITLESS_UNIT ? UNITLESS_SELECT_VALUE : unit;

export const selectValueToUnit = (value: string): UnitOrUnitless =>
  value === UNITLESS_SELECT_VALUE ? UNITLESS_UNIT : (value as Unit);

export const unitAllowsDecimals = (unit: string) =>
  unit === "rem" || unit === UNITLESS_UNIT;

type NumberValueForUnit<U extends UnitOrUnitless> = {
  value: number;
  unit: U;
};

type UnitConfigMap<U extends UnitOrUnitless, T> = Partial<Record<U, T>> & {
  base?: T;
};

// Base configurations for different units
export const baseUnitConfigs = {
  step: {
    base: 1,
    px: 1,
    rem: 0.1,
    "%": 1,
    vh: 1,
    vw: 1,
    [UNITLESS_UNIT]: 0.1,
  },
  min: {
    base: 0,
    px: 0,
    rem: 0,
    "%": 0,
    vh: 0,
    vw: 0,
    [UNITLESS_UNIT]: 0,
  },
  max: {
    base: undefined as number | undefined,
    px: undefined as number | undefined,
    rem: 100,
    "%": 100,
    vh: 100,
    vw: 100,
    [UNITLESS_UNIT]: undefined as number | undefined,
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
    [UNITLESS_UNIT]: [1, 1.1, 1.2, 1.25, 1.5, 1.75, 2],
  },
} as const;

export type RawNumberInputWithUnitsProps<U extends UnitOrUnitless = Unit> = {
  icon: React.JSX.Element;
  min?: UnitConfigMap<U, number>;
  max?: UnitConfigMap<U, number>;
  noMax?: boolean;
  noMin?: boolean;
  allowNegative?: boolean;
  step?: UnitConfigMap<U, number>;
  options?: UnitConfigMap<U, number[]>;
  allowedUnits?: readonly U[];
  forceUnit?: U;
  id?: string;
} & (
  | {
      nullable?: false;
      defaultValue: NumberValueForUnit<U>;
      onChange: (v: NumberValueForUnit<U>) => void;
    }
  | {
      nullable: true;
      defaultValue?: NumberValueForUnit<U> | null;
      onChange: (v: NumberValueForUnit<U> | null) => void;
    }
);

export function RawNumberInputWithUnit<U extends UnitOrUnitless = Unit>({
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
  allowedUnits,
  nullable,
  forceUnit,
  id,
}: RawNumberInputWithUnitsProps<U>) {
  const availableUnits = (allowedUnits ?? units) as readonly U[];
  const [value, setValue] = React.useState(defaultValue?.value ?? null);
  React.useEffect(() => {
    setValue(defaultValue?.value ?? null);
  }, [defaultValue, setValue]);

  const [unit, setUnit] = React.useState<U>(
    defaultValue?.unit ?? forceUnit ?? ("px" as U),
  );
  React.useEffect(() => {
    setUnit(defaultValue?.unit ?? forceUnit ?? ("px" as U));
  }, [defaultValue, forceUnit]);

  const unitKey = unit as UnitOrUnitless;

  // Get current unit values with fallbacks to base configs
  const currentStep =
    step[unit] ??
    step.base ??
    baseUnitConfigs.step[unitKey] ??
    baseUnitConfigs.step.base;
  const currentMin = noMin
    ? allowNegative
      ? undefined
      : 0
    : (min?.[unit] ??
      min?.base ??
      baseUnitConfigs.min[unitKey] ??
      baseUnitConfigs.min.base);
  const currentMax = noMax
    ? undefined
    : (max?.[unit] ??
      max?.base ??
      baseUnitConfigs.max[unitKey] ??
      baseUnitConfigs.max.base);
  const currentOptions = [
    ...(options?.[unit] ??
      options?.base ??
      baseUnitConfigs.options[unitKey] ??
      baseUnitConfigs.options.base),
  ];

  const handleValueChange = useCallback(
    (value: number | null) => {
      const val: NumberValueForUnit<U> | null =
        value === null
          ? null
          : {
              unit,
              value,
            };

      setValue(value);
      onChange(val as NumberValueForUnit<U>);
    },
    [onChange, unit],
  );

  const handleUnitChange = useCallback(
    (nextUnit: U) => {
      const val: NumberValueForUnit<U> | null =
        value === null
          ? null
          : {
              unit: nextUnit,
              value,
            };

      setUnit(nextUnit);
      onChange(val as NumberValueForUnit<U>);
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
        float={unitAllowsDecimals(unit)}
        nullable={nullable}
        step={currentStep}
        disableNegative={!allowNegative}
        id={id}
      />
      <Select
        value={unitToSelectValue(unit)}
        onValueChange={(next) => handleUnitChange(selectValueToUnit(next) as U)}
      >
        <SelectTrigger
          className="w-min"
          size="sm"
          disabled={forceUnit !== undefined}
        >
          <SelectValue placeholder="Select unit" />
        </SelectTrigger>
        <SelectContent>
          {availableUnits.map((u) => (
            <SelectItem key={unitToSelectValue(u)} value={unitToSelectValue(u)}>
              {formatUnitLabel(u)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* <ResetButton onClick={handleChange} /> */}
    </div>
  );
}
