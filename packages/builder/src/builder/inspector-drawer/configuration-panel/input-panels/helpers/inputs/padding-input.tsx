import React from "react";

import { Label } from "@hacado/ui";
import {
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
} from "lucide-react";
import { RawSliderInput } from "./raw/raw-slider-input";

type TPaddingValue = {
  top: number;
  bottom: number;
  right: number;
  left: number;
};

type Props = {
  label: string;
  defaultValue: TPaddingValue | null;
  onChange: (value: TPaddingValue) => void;
};

export const PaddingInput: React.FC<Props> = ({
  label,
  defaultValue,
  onChange,
}) => {
  const [value, setValue] = React.useState(() => {
    if (defaultValue) {
      return defaultValue;
    }

    return {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    };
  });

  const handleChange = (internalName: keyof TPaddingValue, nValue?: number) => {
    const v = {
      ...value,
      [internalName]: nValue,
    };
    setValue(v);
    onChange(v);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-2 w-full">
        <div className="w-full flex flex-row gap-2">
          <RawSliderInput
            iconLabel={<AlignStartHorizontal size={16} />}
            value={value?.top}
            setValue={(num) => handleChange("top", num)}
            units="px"
            step={4}
            min={0}
            max={80}
          />
        </div>

        <div className="w-full flex flex-row gap-2">
          <RawSliderInput
            iconLabel={<AlignEndHorizontal size={16} />}
            value={value?.bottom}
            setValue={(num) => handleChange("bottom", num)}
            units="px"
            step={4}
            min={0}
            max={80}
          />
        </div>

        <div className="w-full flex flex-row gap-2">
          <RawSliderInput
            iconLabel={<AlignStartVertical size={16} />}
            value={value?.left}
            setValue={(num) => handleChange("left", num)}
            units="px"
            step={4}
            min={0}
            max={80}
          />
        </div>

        <div className="w-full flex flex-row gap-2">
          <RawSliderInput
            iconLabel={<AlignEndVertical size={16} />}
            value={value?.right}
            setValue={(num) => handleChange("right", num)}
            units="px"
            step={4}
            min={0}
            max={80}
          />
        </div>
      </div>
    </div>
  );
};
