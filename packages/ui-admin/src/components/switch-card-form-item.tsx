"use client";

import {
  cn,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  Skeleton,
  Switch,
} from "@hacado/ui";
import React from "react";

export type SwitchCardFormItemProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  /** Keep the switch at the top when extra fields appear after it is turned on. */
  alwaysItemsStart?: boolean;
  children?: React.ReactNode;
};

export const SwitchCardFormItem: React.FC<SwitchCardFormItemProps> = ({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  loading,
  className,
  alwaysItemsStart,
  children,
}) => {
  const extra = React.Children.toArray(children);

  return (
    <FormItem
      className={cn(
        "flex min-w-0 flex-row justify-between gap-4 rounded-lg border p-4",
        extra.length > 0 || alwaysItemsStart ? "items-start" : "items-center",
        className,
      )}
    >
      <div className="flex min-w-0 w-full h-full flex-1 flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          {typeof label === "string" ? <FormLabel>{label}</FormLabel> : label}
          {typeof description === "string" ? (
            <FormDescription>{description}</FormDescription>
          ) : (
            description
          )}
        </div>
        {extra.length > 0 ? (
          <>
            <div className="flex-1" />
            <div className="flex min-w-0 w-full flex-col gap-2 [&>*]:min-w-0 [&>*]:max-w-full">
              {children}
            </div>
          </>
        ) : null}
      </div>
      <FormControl>
        {loading ? (
          <Skeleton className="h-6 w-11 shrink-0" />
        ) : (
          <Switch
            checked={checked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
          />
        )}
      </FormControl>
    </FormItem>
  );
};
