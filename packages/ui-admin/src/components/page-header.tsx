"use client";

import { cn } from "@hacado/ui/cn";
import { Separator } from "@hacado/ui/separator";
import React from "react";

export type PageHeaderProps = {
  text?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  titleClassName?: string;
  actionsClassName?: string;
};

export function PageHeader({
  text,
  actions,
  className,
  innerClassName,
  titleClassName,
  actionsClassName,
}: PageHeaderProps) {
  if (!text && !actions) return null;

  return (
    <div
      className={cn(
        "-mx-4 -mt-2 mb-2 shrink-0 border-b border-border bg-background px-4 md:-mx-6 md:px-6",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 md:gap-4",
          innerClassName,
        )}
      >
        {text ? (
          <div
            className={cn(
              "peer/name flex min-w-0 flex-1 items-center gap-1.5 self-center transition-all",
              actions && "max-md:focus-within:min-w-[75%]",
              titleClassName,
            )}
          >
            {typeof text === "string" ? (
              <p className="my-2 min-w-0 line-clamp-2 text-xs text-muted-foreground md:text-sm">
                {text}
              </p>
            ) : (
              text
            )}
            {actions ? (
              <Separator
                orientation="vertical"
                className="hidden h-4 md:block"
              />
            ) : null}
          </div>
        ) : null}
        {actions ? (
          <div
            className={cn(
              "min-w-0 transition-all",
              text
                ? "ml-auto max-w-[50%] [&>*]:min-w-0 [&>*]:max-w-full max-md:peer-focus-within/name:max-w-[25%]"
                : "flex-1",
              actionsClassName,
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
