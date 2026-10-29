"use client";

import { cn, Label, Skeleton, Switch } from "@hacado/ui";
import React from "react";

export type SwitchCardProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
  checked?: boolean | null;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  /** Keep the switch at the top when extra fields appear after it is turned on. */
  alwaysItemsStart?: boolean;
  children?: React.ReactNode;
  noCard?: boolean | "borderTop";
};

export const SwitchCard: React.FC<SwitchCardProps> = ({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  loading,
  className,
  children,
  noCard,
}) => {
  const id = React.useId();
  const extra = React.Children.toArray(children);
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        !noCard
          ? "border p-4 rounded-lg"
          : noCard === "borderTop"
            ? "border-t py-4"
            : undefined,
        className,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 w-full flex-row justify-between gap-4",
          "items-center",
        )}
      >
        <div className="flex min-w-0 w-full h-full flex-1 flex-col gap-2 justify-center">
          <div className="flex flex-col gap-0.5">
            {typeof label === "string" ? (
              <Label htmlFor={id}>{label}</Label>
            ) : (
              label
            )}
            {description ? (
              <p id={descriptionId} className="text-muted-foreground text-sm">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-6 w-11 shrink-0" />
        ) : (
          <Switch
            id={id}
            aria-describedby={descriptionId}
            checked={!!checked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
          />
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
  );
};
