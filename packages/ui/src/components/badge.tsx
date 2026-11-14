import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

import { cn } from "../utils";

const badgeVariants = cva(
  "inline-flex gap-1.5 [&>svg]:size-4 [&>svg]:shrink-0 items-center rounded-full font-medium border px-2.5 py-0.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
        warning: "bg-amber-50 text-amber-700 border-amber-200/70",
        error: "bg-red-50 text-red-700 border-red-200/70",
      },
      size: {
        xs: "text-xs py-0.5 px-1 [&>svg]:size-3",
        sm: "text-sm py-0.5 px-2 [&>svg]:size-3.5",
        md: "text-sm py-0.75 px-2.5 [&>svg]:size-4",
        lg: "text-base py-1 px-3 [&>svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
