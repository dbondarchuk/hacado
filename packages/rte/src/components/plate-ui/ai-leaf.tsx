"use client";

import React from "react";

import { cn } from "@hacado/ui";
import { PlateLeaf } from "@udecode/plate/react";

export function AILeaf({
  className,
  ...props
}: React.ComponentProps<typeof PlateLeaf>) {
  return (
    <PlateLeaf
      className={cn(
        className,
        "border-b-2 border-b-purple-100 bg-purple-50 text-purple-800",
        "transition-all duration-200 ease-in-out",
      )}
      {...props}
    />
  );
}
