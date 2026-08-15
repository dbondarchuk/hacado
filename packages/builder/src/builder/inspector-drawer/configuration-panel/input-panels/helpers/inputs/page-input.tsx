import React from "react";

import { cn, FormDescription, Label } from "@hacado/ui";
import { PageSelectorInput, PageSelectorInputProps } from "@hacado/ui-admin";
import { ResetButton } from "./reset-button";

type Props = Omit<PageSelectorInputProps, "value" | "onChange" | "onBlur"> & {
  label: string;
  helperText?: string | React.JSX.Element;
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

export const PageInput: React.FC<Props> = ({
  helperText,
  label,
  defaultValue,
  onChange,
  nullable,
  className,
  ...rest
}) => {
  const [value, setValue] = React.useState(defaultValue);
  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, setValue]);

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex w-full">
        <PageSelectorInput
          className={cn("w-full", className)}
          value={value}
          h="sm"
          {...rest}
          onChange={(v) => {
            setValue(v);
            onChange(v);
          }}
        />
        {nullable && (
          <ResetButton
            onClick={() => {
              setValue(null);
              onChange(null);
            }}
            size="sm"
          />
        )}
      </div>
      {helperText && <FormDescription>{helperText}</FormDescription>}
    </div>
  );
};
