import React from "react";

import {
  MemberSelector,
  MemberSelectorProps,
} from "@hacado/ui-admin/member-selector";
import { cn } from "@hacado/ui/cn";
import { FormDescription } from "@hacado/ui/form";
import { Label } from "@hacado/ui/label";

type Props = Omit<
  MemberSelectorProps,
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

export const MemberInput: React.FC<Props> = ({
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
          <MemberSelector
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
          <MemberSelector
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
        {/* {nullable && (
          <ResetButton
            onClick={() => {
              setValue(null);
              onChange(null);
            }}
            size="sm"
          />
        )} */}
      </div>
      {helperText && <FormDescription>{helperText}</FormDescription>}
    </div>
  );
};
