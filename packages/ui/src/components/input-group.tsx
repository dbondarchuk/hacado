import { cva } from "class-variance-authority";
import React from "react";
import { cn } from "../utils";
import { invalidGroupedClass } from "./invalid-field";

export const InputGroupAddonClasses = cva(
  [
    // "h-9",
    "rounded-md",
    "border",
    "border-input",
    "bg-background",
    "py-2",
    "text-base",
    "text-muted-foreground",
    "ring-offset-background",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed",
    "disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        suffix: ["pr-3", "border-l-0", "rounded-l-none"],
        prefix: ["pl-3", "border-r-0", "rounded-r-none"],
      },
      h: {
        lg: "h-10",
        md: "h-9",
        sm: "h-8",
        xs: "h-7",
      },
    },
    defaultVariants: {
      variant: "suffix",
      // h: "sm",
      h: "md",
    },
  },
);

export const InputGroupInputClasses = cva(
  ["focus:ring-0", "focus-visible:ring-0", "focus-visible:ring-offset-0"],
  {
    variants: {
      variant: {
        suffix: ["border-r-0", "rounded-r-none"],
        prefix: ["border-l-0", "rounded-l-none"],
        both: ["border-l-0", "border-r-0", "rounded-l-none", "rounded-r-none"],
      },
    },
    defaultVariants: {
      variant: "suffix",
    },
  },
);

type ChildrenWithClassName = React.PropsWithChildren & {
  className?: string;
};

export const InputGroupAddon: React.FC<ChildrenWithClassName> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("flex items-center min-w-max", className)}>
      {children}
    </div>
  );
};

export const InputGroupInput: React.FC<ChildrenWithClassName> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("block w-full border-0", className)}>{children}</div>
  );
};

export const InputGroup = ({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "rounded-md relative flex focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        "[&_[data-slot=combobox-trigger]]:ring-0 [&_[data-slot=combobox-trigger]]:ring-offset-0 [&_[data-slot=combobox-trigger]]:focus-within:ring-0",
        "[&_[role=combobox]]:ring-0 [&_[role=combobox]]:ring-offset-0 [&_[role=combobox]]:focus:ring-0 [&_[role=combobox]]:focus-visible:ring-0",
        "has-[[data-state=open]]:ring-2 has-[[data-state=open]]:ring-ring has-[[data-state=open]]:ring-offset-2 has-[[data-state=open]]:ring-offset-background",
        "[&:has([data-state=open])_input]:border-ring [&:has([data-state=open])_button]:border-ring [&:has([data-state=open])>*]:border-ring",
        invalidGroupedClass,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
