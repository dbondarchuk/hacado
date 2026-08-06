"use client";

import * as React from "react";
import { useIsTouchDevice } from "../hooks/use-is-touch-device";
import { cn } from "../utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

type TooltipResponsiveContextValue = {
  isTouchDevice: boolean;
};

const TooltipResponsiveContext =
  React.createContext<TooltipResponsiveContextValue | null>(null);

function useTooltipResponsiveContext() {
  const ctx = React.useContext(TooltipResponsiveContext);
  if (!ctx) {
    throw new Error(
      "TooltipResponsive components must be used inside <TooltipResponsive>",
    );
  }
  return ctx;
}

interface TooltipResponsiveProps {
  children: React.ReactNode;
}

export function TooltipResponsive({ children }: TooltipResponsiveProps) {
  const isTouchDevice = useIsTouchDevice();

  const value = React.useMemo(
    () => ({
      isTouchDevice,
    }),
    [isTouchDevice],
  );

  return (
    <TooltipResponsiveContext.Provider value={value}>
      {isTouchDevice ? (
        <Popover>{children}</Popover>
      ) : (
        <TooltipProvider delayDuration={200}>
          <Tooltip>{children}</Tooltip>
        </TooltipProvider>
      )}
    </TooltipResponsiveContext.Provider>
  );
}

interface TooltipResponsiveTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function TooltipResponsiveTrigger({
  children,
  className,
}: TooltipResponsiveTriggerProps) {
  const { isTouchDevice } = useTooltipResponsiveContext();

  if (isTouchDevice) {
    return (
      <PopoverTrigger asChild className={className}>
        {children}
      </PopoverTrigger>
    );
  }

  return (
    <TooltipTrigger asChild className={className}>
      {children}
    </TooltipTrigger>
  );
}

interface TooltipResponsiveContentProps {
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  alignOffset?: number;
  sideOffset?: number;
  className?: string;
  hideWhenDetached?: boolean;
}

export function TooltipResponsiveContent({
  children,
  side,
  align,
  alignOffset,
  sideOffset,
  className,
  hideWhenDetached,
}: TooltipResponsiveContentProps) {
  const { isTouchDevice } = useTooltipResponsiveContext();

  if (isTouchDevice) {
    return (
      <PopoverContent
        side={side}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "w-fit max-w-xs bg-foreground text-background text-sm p-2 text-pretty",
          className,
        )}
        hideWhenDetached={hideWhenDetached}
      >
        {children}
      </PopoverContent>
    );
  }

  return (
    <TooltipContent
      side={side}
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn("max-w-xs text-pretty", className)}
      hideWhenDetached={hideWhenDetached}
    >
      {children}
    </TooltipContent>
  );
}
