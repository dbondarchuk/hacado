import { BuilderKeys, useI18n } from "@hacado/i18n/client";
import {
  Button,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hacado/ui";
import React from "react";
import { Breakpoint, breakpoints } from "../../style/zod";

interface BreakpointSelectorProps {
  breakpoints: Breakpoint[];
  onBreakpointsChange: (breakpoints: Breakpoint[]) => void;
  styleName: string;
  variantIndex: number;
}

// Helper function to check if breakpoints conflict
const hasConflictingBreakpoints = (
  currentBreakpoints: Breakpoint[],
  newBreakpoint: Breakpoint,
): boolean => {
  const minWidthBreakpoints = ["sm", "md", "lg", "xl", "2xl"];
  const maxWidthBreakpoints = [
    "max-sm",
    "max-md",
    "max-lg",
    "max-xl",
    "max-2xl",
  ];

  const breakpointValues = {
    sm: 40,
    md: 48,
    lg: 64,
    xl: 80,
    "2xl": 96,
    "max-sm": 40,
    "max-md": 48,
    "max-lg": 64,
    "max-xl": 80,
    "max-2xl": 96,
  } as const;

  // If we already have 2 breakpoints, don't allow more
  if (currentBreakpoints.length >= 2) {
    return true;
  }

  // If we have 1 breakpoint, check if the new one is compatible
  if (currentBreakpoints.length === 1) {
    const existing = currentBreakpoints[0];
    const existingValue = breakpointValues[existing];
    const newValue = breakpointValues[newBreakpoint];

    // If existing is min-width and new is max-width
    if (
      minWidthBreakpoints.includes(existing) &&
      maxWidthBreakpoints.includes(newBreakpoint)
    ) {
      return existingValue >= newValue; // Allow only if min < max
    }

    // If existing is max-width and new is min-width
    if (
      maxWidthBreakpoints.includes(existing) &&
      minWidthBreakpoints.includes(newBreakpoint)
    ) {
      return newValue >= existingValue; // Allow only if min < max
    }

    // If both are same type (both min or both max), don't allow
    return true;
  }

  return false;
};

// Helper function to get conflicting breakpoint for a given breakpoint
const getConflictingBreakpoints = (
  breakpoint: Breakpoint,
  currentBreakpoints: Breakpoint[],
): Breakpoint[] => {
  const minWidthBreakpoints = ["sm", "md", "lg", "xl", "2xl"];
  const maxWidthBreakpoints = [
    "max-sm",
    "max-md",
    "max-lg",
    "max-xl",
    "max-2xl",
  ];

  const breakpointValues = {
    sm: 40,
    md: 48,
    lg: 64,
    xl: 80,
    "2xl": 96,
    "max-sm": 40,
    "max-md": 48,
    "max-lg": 64,
    "max-xl": 80,
    "max-2xl": 96,
  } as const;

  // If we already have 2 breakpoints, return all existing ones
  if (currentBreakpoints.length >= 2) {
    return currentBreakpoints;
  }

  // If we have 1 breakpoint, check if the new one is compatible
  if (currentBreakpoints.length === 1) {
    const existing = currentBreakpoints[0];
    const existingValue = breakpointValues[existing];
    const newValue = breakpointValues[breakpoint];

    // If existing is min-width and new is max-width
    if (
      minWidthBreakpoints.includes(existing) &&
      maxWidthBreakpoints.includes(breakpoint)
    ) {
      if (existingValue >= newValue) {
        return [existing]; // Min-width is too large for this max-width
      }
    }

    // If existing is max-width and new is min-width
    if (
      maxWidthBreakpoints.includes(existing) &&
      minWidthBreakpoints.includes(breakpoint)
    ) {
      if (newValue >= existingValue) {
        return [existing]; // Max-width is too small for this min-width
      }
    }

    // If both are same type (both min or both max), return the existing one
    if (
      (minWidthBreakpoints.includes(existing) &&
        minWidthBreakpoints.includes(breakpoint)) ||
      (maxWidthBreakpoints.includes(existing) &&
        maxWidthBreakpoints.includes(breakpoint))
    ) {
      return [existing];
    }
  }

  return [];
};

export const BreakpointSelector: React.FC<BreakpointSelectorProps> = ({
  breakpoints: currentBreakpoints,
  onBreakpointsChange,
  styleName,
  variantIndex,
}) => {
  const t = useI18n("builder");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="xs" className="w-full h-6 text-xs">
          {t("pageBuilder.styles.breakpoints.shortLabel", {
            count: currentBreakpoints?.length ?? 0,
          })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="space-y-2">
          <Label className="text-xs">
            {t("pageBuilder.styles.breakpoints.title")}
          </Label>
          {breakpoints.map((bp) => (
            <div key={bp} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`${styleName}-${variantIndex}-bp-${bp}`}
                checked={currentBreakpoints?.includes(bp) || false}
                disabled={
                  !currentBreakpoints?.includes(bp) &&
                  hasConflictingBreakpoints(currentBreakpoints || [], bp)
                }
                onChange={(e) => {
                  const current = currentBreakpoints || [];

                  if (e.target.checked) {
                    // If we already have 2 breakpoints, replace the incompatible one
                    if (current.length >= 2) {
                      const conflicting = getConflictingBreakpoints(
                        bp,
                        current,
                      );
                      const filtered = current.filter(
                        (b) => !conflicting.includes(b),
                      );
                      const newBreakpoints = [...filtered, bp];
                      onBreakpointsChange(newBreakpoints);
                    } else {
                      // Add the new breakpoint
                      const newBreakpoints = [...current, bp];
                      onBreakpointsChange(newBreakpoints);
                    }
                  } else {
                    // Removing breakpoint
                    const newBreakpoints = current.filter((b) => b !== bp);
                    onBreakpointsChange(
                      newBreakpoints.length > 0 ? newBreakpoints : [],
                    );
                  }
                }}
                className={`h-3 w-3 ${
                  !currentBreakpoints?.includes(bp) &&
                  hasConflictingBreakpoints(currentBreakpoints || [], bp)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              />
              <Label
                htmlFor={`${styleName}-${variantIndex}-bp-${bp}`}
                className={`text-xs w-full ${
                  !currentBreakpoints?.includes(bp) &&
                  hasConflictingBreakpoints(currentBreakpoints || [], bp)
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                title={
                  !currentBreakpoints?.includes(bp) &&
                  hasConflictingBreakpoints(currentBreakpoints || [], bp)
                    ? (() => {
                        const current = currentBreakpoints || [];
                        if (current.length >= 2) {
                          return "Maximum 2 breakpoints allowed (one min-width, one max-width)";
                        }
                        if (current.length === 1) {
                          const existing = current[0];
                          const minWidthBreakpoints = [
                            "sm",
                            "md",
                            "lg",
                            "xl",
                            "2xl",
                          ];
                          const maxWidthBreakpoints = [
                            "max-sm",
                            "max-md",
                            "max-lg",
                            "max-xl",
                            "max-2xl",
                          ];

                          if (minWidthBreakpoints.includes(existing)) {
                            return "Select a max-width breakpoint smaller than the current min-width";
                          } else {
                            return "Select a min-width breakpoint larger than the current max-width";
                          }
                        }
                        return "Select another breakpoint to create a range";
                      })()
                    : undefined
                }
              >
                {t(`pageBuilder.styles.breakpoints.${bp}` as BuilderKeys)}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
