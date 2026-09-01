"use client";

import {
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  cn,
} from "@hacado/ui";
import { forwardRef, type ComponentProps, type ReactNode } from "react";

type FluidChromeTooltipButtonProps = ComponentProps<"button"> & {
  tooltip: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
};

export const FluidChromeTooltipButton = forwardRef<
  HTMLButtonElement,
  FluidChromeTooltipButtonProps
>(function FluidChromeTooltipButton(
  {
    tooltip,
    tooltipSide = "right",
    className,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <TooltipResponsive>
      <TooltipResponsiveTrigger>
        <button ref={ref} type={type} className={cn(className)} {...props}>
          {children}
        </button>
      </TooltipResponsiveTrigger>
      <TooltipResponsiveContent side={tooltipSide}>
        {tooltip}
      </TooltipResponsiveContent>
    </TooltipResponsive>
  );
});
