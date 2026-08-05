import React from "react";

import { Label, RadioButtonGroup } from "@hacado/ui";
import { ResetButton } from "./reset-button";

type Props = {
  label: string | React.JSX.Element;
  children: React.JSX.Element | React.JSX.Element[];
} & (
  | {
      defaultValue: string;
      onChange: (v: string) => void;
      nullable?: false;
    }
  | {
      defaultValue: string | null;
      onChange: (v: string | null) => void;
      nullable: true;
    }
);

export const RadioGroupInput: React.FC<Props> = ({
  label,
  children,
  defaultValue,
  onChange,
  nullable,
}) => {
  const [value, setValue] = React.useState(defaultValue);
  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, setValue]);

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex w-full">
        <RadioButtonGroup
          value={value ?? undefined}
          onValueChange={(v) => {
            setValue(v);
            onChange(v);
          }}
        >
          {children}
        </RadioButtonGroup>
        {nullable && (
          <ResetButton
            onClick={() => {
              setValue(null);
              onChange(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
