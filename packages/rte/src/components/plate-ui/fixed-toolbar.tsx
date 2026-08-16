"use client";

import { cn, Toolbar } from "@hacado/ui";
import type { ComponentProps } from "react";

const inlineToolbarClassName =
  "sticky top-0.5 left-0 z-40 scrollbar-hide w-[calc(100%-4px)] max-w-full min-w-0 mx-auto justify-between overflow-x-auto border-b border-b-border bg-background/95 p-1 backdrop-blur-sm supports-backdrop-blur:bg-background/60 rte-fixed-toolbar";

const overlayToolbarClassName =
  "relative z-40 mb-1 scrollbar-hide w-full min-w-0 max-w-full overflow-x-auto border border-border bg-background/95 p-1 shadow-sm backdrop-blur-sm supports-backdrop-blur:bg-background/60 rte-fixed-toolbar";

export const FixedToolbar = ({
  overlay,
  className,
  ...props
}: ComponentProps<typeof Toolbar> & { overlay?: boolean }) => (
  <Toolbar
    className={cn(
      overlay ? overlayToolbarClassName : inlineToolbarClassName,
      className,
    )}
    {...props}
  />
);
