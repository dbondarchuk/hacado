"use client";

import React from "react";

import {
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
} from "lucide-react";
import {
  FourSideValues,
  NumberValueWithUnitOrGlobalKeyword,
} from "../style/zod";
import { RawNumberInputWithUnitsAndKeywords } from "./base/raw-number-input-with-units-and-keywords";

type Props = {
  defaultValue: FourSideValues;
  onChange: (value: FourSideValues) => void;
  notAllowedGlobalKeywords?: React.ComponentProps<
    typeof RawNumberInputWithUnitsAndKeywords
  >["notAllowedGlobalKeywords"];
  allowNegative?: boolean;
  noMin?: boolean;
  noMax?: boolean;
};

const step = {
  px: 1,
  rem: 0.2,
  base: 1,
};

const min = {
  px: 0,
  rem: 0,
  base: 0,
};

const max = {
  px: 100,
  rem: 80,
  base: 80,
};

const options = {
  px: [1, 2, 4, 8, 10, 12, 16, 24, 36, 48, 64],
  rem: [0.5, 1, 1.2, 1.3, 1.5, 2, 3, 4, 5, 6],
  base: [1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100],
};

export const FourSideValuesInput: React.FC<Props> = ({
  defaultValue,
  onChange,
  notAllowedGlobalKeywords,
  allowNegative,
  noMin,
  noMax,
}) => {
  const [value, setValue] = React.useState<FourSideValues>(
    defaultValue ?? {
      top: null,
      bottom: null,
      left: null,
      right: null,
    },
  );

  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleChange = (
    internalName: keyof FourSideValues,
    nValue?: NumberValueWithUnitOrGlobalKeyword | null,
  ) => {
    const v = {
      ...value,
      [internalName]: nValue,
    };

    setValue(v);
    onChange(v);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 w-full">
        <div className="w-full flex flex-row gap-1">
          <RawNumberInputWithUnitsAndKeywords
            icon={<AlignStartHorizontal size={16} />}
            value={value.top}
            onChange={(val) => handleChange("top", val)}
            step={step}
            min={min}
            max={max}
            options={options}
            nullable
            notAllowedGlobalKeywords={notAllowedGlobalKeywords}
            allowNegative={allowNegative}
            noMin={noMin}
            noMax={noMax}
          />
        </div>

        <div className="w-full flex flex-row gap-1">
          <RawNumberInputWithUnitsAndKeywords
            icon={<AlignEndHorizontal size={16} />}
            value={value.bottom}
            onChange={(val) => handleChange("bottom", val)}
            step={step}
            min={min}
            max={max}
            options={options}
            nullable
            notAllowedGlobalKeywords={notAllowedGlobalKeywords}
            allowNegative={allowNegative}
            noMin={noMin}
            noMax={noMax}
          />
        </div>

        <div className="w-full flex flex-row gap-1">
          <RawNumberInputWithUnitsAndKeywords
            icon={<AlignStartVertical size={16} />}
            value={value.left}
            onChange={(val) => handleChange("left", val)}
            step={step}
            min={min}
            max={max}
            options={options}
            nullable
            notAllowedGlobalKeywords={notAllowedGlobalKeywords}
            allowNegative={allowNegative}
            noMin={noMin}
            noMax={noMax}
          />
        </div>

        <div className="w-full flex flex-row gap-1">
          <RawNumberInputWithUnitsAndKeywords
            icon={<AlignEndVertical size={16} />}
            value={value.right}
            onChange={(val) => handleChange("right", val)}
            step={step}
            min={min}
            max={max}
            options={options}
            nullable
            notAllowedGlobalKeywords={notAllowedGlobalKeywords}
            allowNegative={allowNegative}
            noMin={noMin}
            noMax={noMax}
          />
        </div>
      </div>
    </div>
  );
};
