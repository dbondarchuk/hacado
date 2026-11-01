"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import React from "react";

import { cva, VariantProps } from "class-variance-authority";
import { cn } from "../utils";
import { withTooltip } from "./tooltip";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = withTooltip(PopoverPrimitive.Trigger);

const PopoverAnchor = PopoverPrimitive.Anchor;

const popoverVariants = cva(
  "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden print:hidden",
  {
    defaultVariants: {
      animate: true,
    },
    variants: {
      animate: {
        true: "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
      },
    },
  },
);

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> &
    VariantProps<typeof popoverVariants>
>(({ className, align = "center", animate, sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(popoverVariants({ animate }), className)}
      {...props}
    />
  </PopoverPrimitive.Portal>
));

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
  popoverVariants,
};
