import React, { ReactNode } from "react";

import {
  cn,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  InputProps,
} from "@hacado/ui";
import { ResetButton } from "../reset-button";

export type RawDoubleNumberInputProps = {
  unit?: string;
  x?: ReactNode;
  prefix1?: ReactNode;
  prefix2?: ReactNode;
  size?: InputProps["h"];
  asRow?: boolean;
} & (
  | {
      defaultValue1: number;
      onChange1: (v: number) => void;
      defaultValue2: number;
      onChange2: (v: number) => void;
      nullable?: false;
    }
  | {
      defaultValue1: number | null;
      onChange1: (v: number | null) => void;
      defaultValue2: number | null;
      onChange2: (v: number | null) => void;
      nullable: true;
    }
);

export const RawDoubleNumberInput: React.FC<RawDoubleNumberInputProps> = ({
  defaultValue1,
  onChange1,
  defaultValue2,
  onChange2,
  nullable,
  prefix1,
  prefix2,
  unit = "px",
  x,
  size,
  asRow = false,
}) => {
  const handleChange = (val: string | null, right: boolean) => {
    const value = parseInt(val ?? "");
    if (nullable) {
      (right ? onChange2 : onChange1)(isNaN(value) ? null : value);
    } else {
      (right ? onChange2 : onChange1)(isNaN(value) ? 0 : value);
    }
  };

  return (
    <div
      className={cn(
        "w-full items-center justify-center",
        asRow
          ? ["grid gap-1", !!x ? "grid-cols-[1fr_auto_1fr]" : "grid-cols-1"]
          : "flex flex-row gap-2 flex-wrap",
      )}
    >
      <InputGroup>
        {prefix1 && (
          <InputGroupAddon
            className={InputGroupAddonClasses({
              variant: "prefix",
              h: size,
            })}
          >
            {prefix1}
          </InputGroupAddon>
        )}
        <InputGroupInput>
          <Input
            type="number"
            className={cn(
              "min-w-10",
              InputGroupInputClasses(),
              prefix1 && InputGroupInputClasses({ variant: "prefix" }),
            )}
            h={size}
            value={defaultValue1?.toString() || ""}
            onChange={(e) => handleChange(e.target.value, false)}
          />
        </InputGroupInput>
        <InputGroupAddon className={InputGroupAddonClasses({ h: size })}>
          {unit}
        </InputGroupAddon>
        {nullable && (
          <ResetButton
            size={size}
            onClick={() => {
              handleChange(null, false);
            }}
          />
        )}
      </InputGroup>
      {x && <div>{x}</div>}
      <InputGroup>
        {prefix2 && (
          <InputGroupAddon
            className={InputGroupAddonClasses({
              variant: "prefix",
              h: size,
            })}
          >
            {prefix2}
          </InputGroupAddon>
        )}
        <InputGroupInput>
          <Input
            type="number"
            className={cn(
              "min-w-10",
              InputGroupInputClasses(),
              prefix2 && InputGroupInputClasses({ variant: "prefix" }),
            )}
            h={size}
            value={defaultValue2?.toString() || ""}
            onChange={(e) => handleChange(e.target.value, true)}
          />
        </InputGroupInput>
        <InputGroupAddon className={InputGroupAddonClasses({ h: size })}>
          {unit}
        </InputGroupAddon>
        {nullable && (
          <ResetButton
            size={size}
            onClick={() => {
              handleChange(null, true);
            }}
          />
        )}
      </InputGroup>
    </div>
  );
};
