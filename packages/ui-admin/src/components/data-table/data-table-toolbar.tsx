"use client";

import { cn } from "@hacado/ui/cn";
import { Separator } from "@hacado/ui/separator";
import React from "react";

export function DataTableToolbar({
  children,
  actions,
  className,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 w-full flex-nowrap items-center gap-2 md:gap-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 md:gap-4">
        {children}
      </div>
      {actions ? (
        <>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </>
      ) : null}
    </div>
  );
}

export function TableToolbarActionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className="max-sm:sr-only">{children}</span>;
}
