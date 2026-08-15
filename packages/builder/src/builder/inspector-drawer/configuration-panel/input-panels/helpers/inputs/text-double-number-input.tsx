import React from "react";

import { Label } from "@hacado/ui";
import {
  RawDoubleNumberInput,
  RawDoubleNumberInputProps,
} from "./raw/raw-double-number-input";

type TextDoubleNumberInputProps = RawDoubleNumberInputProps & {
  label: string;
};

export const TextDoubleNumberInput: React.FC<TextDoubleNumberInputProps> = ({
  label,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <RawDoubleNumberInput {...props} />
    </div>
  );
};
