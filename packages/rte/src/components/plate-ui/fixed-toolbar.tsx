"use client";

import { Toolbar, withCn } from "@hacado/ui";

export const FixedToolbar = withCn(
  Toolbar,
  "sticky top-0.5 left-0 z-40 scrollbar-hide w-[calc(100%-4px)] mx-auto justify-between overflow-x-auto border-b border-b-border bg-background/95 p-1 backdrop-blur-sm supports-backdrop-blur:bg-background/60 rte-fixed-toolbar",
);
