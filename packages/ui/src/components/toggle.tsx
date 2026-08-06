"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { cn } from "../utils";
import { withTooltip } from "./tooltip";

export const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-base font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[pressed=true]:bg-accent data-[pressed=true]:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        // default: "h-10 px-3 min-w-10",
        default: "h-8 px-2 min-w-8",
        md: "h-10 px-3 min-w-10",
        sm: "h-9 px-2.5 min-w-9",
        lg: "h-11 px-5 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export const Toggle = withTooltip(
  React.forwardRef<
    React.ElementRef<typeof TogglePrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
      VariantProps<typeof toggleVariants>
  >(({ className, variant, size, ...props }, ref) => (
    <TogglePrimitive.Root
      ref={ref}
      data-pressed={props.pressed ?? "false"}
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )),
);
