import React from "react";

import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hacado/ui";
import { ResetButton } from "./reset-button";

type Props = Pick<React.ComponentProps<typeof SelectTrigger>, "size"> & {
  label: string;
  placeholder?: string;
  options: {
    value: string;
    label: string | React.ReactNode;
    style?: React.CSSProperties;
  }[];
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

export const SelectInput: React.FC<Props> = ({
  label,
  nullable,
  placeholder,
  onChange,
  defaultValue,
  options,
  size = "sm",
}) => {
  const [value, setValue] = React.useState(defaultValue);
  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, setValue]);

  const selectOptions = options.map((option) => (
    <SelectItem key={option.value} value={option.value} style={option.style}>
      {option.label}
    </SelectItem>
  ));

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex w-full">
        <Select
          value={value ?? undefined}
          onValueChange={(v) => {
            setValue(v);
            onChange(v);
          }}
        >
          <SelectTrigger className="w-full" size={size}>
            <SelectValue placeholder={placeholder ?? "Select option"} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>{selectOptions}</SelectGroup>
          </SelectContent>
        </Select>
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
