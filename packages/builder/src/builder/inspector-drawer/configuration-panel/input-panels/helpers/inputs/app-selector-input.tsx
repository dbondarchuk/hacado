import React from "react";

import { AppScope, Prettify } from "@hacado/types";
import { cn, FormDescription, Label } from "@hacado/ui";
import { AppSelector, AppSelectorProps } from "@hacado/ui-admin";
import { ResetButton } from "./reset-button";

type Props = Prettify<
  Omit<
    AppSelectorProps,
    | "value"
    | "onChange"
    | "onBlur"
    | "size"
    | "allowClear"
    | "appName"
    | "scope"
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
    )
> &
  (
    | {
        appName: string;
        scope?: never;
      }
    | {
        appName?: never;
        scope: AppScope;
      }
  );

export const AppSelectorInput: React.FC<Props> = ({
  helperText,
  label,
  defaultValue,
  onChange,
  nullable,
  className,
  appName,
  scope,
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
        <AppSelector
          className={cn("w-full", className)}
          appName={appName as any}
          scope={scope as any}
          {...rest}
          value={value ?? undefined}
          size="sm"
          allowClear={nullable}
          onItemSelect={(v: string | undefined) => {
            setValue(v ?? null);
            onChange((v ?? null) as string);
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
