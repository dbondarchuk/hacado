import React from "react";

import { cn, FormDescription, Label } from "@hacado/ui";
import { OptionSelector, OptionSelectorProps } from "@hacado/ui-admin";
import { ResetButton } from "./reset-button";

type Props = Omit<
  OptionSelectorProps,
  "value" | "onChange" | "onBlur" | "onItemSelect" | "allowClear"
> & {
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

export const ServiceInput: React.FC<Props> = ({
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
        {nullable ? (
          <OptionSelector
            className={cn("w-full", className)}
            value={value ?? undefined}
            allowClear
            {...rest}
            onItemSelect={(v) => {
              setValue(v ?? null);
              onChange(v ?? null);
            }}
          />
        ) : (
          <OptionSelector
            className={cn("w-full", className)}
            value={value ?? undefined}
            {...rest}
            onItemSelect={(v) => {
              if (!v) return;
              setValue(v);
              onChange(v);
            }}
          />
        )}
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
