"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";
import React from "react";

import { cn } from "../utils";
import { toggleVariants } from "./toggle";

type Variants = VariantProps<typeof toggleVariants> & {
  separated?: boolean;
};

const ToggleGroupContext = React.createContext<Variants>({
  size: "default",
  variant: "default",
  separated: false,
});

function ToggleGroup({
  className,
  variant,
  size,
  separated,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & Variants) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit items-center data-[variant=outline]:shadow-xs",
        separated ? "gap-2" : "rounded-md",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, separated }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & Variants) {
  const context = React.useContext(ToggleGroupContext);
  const separated = context.separated || props.separated;

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        // "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
        "min-w-0 flex-1 shrink-0 shadow-none rounded-md focus:z-10 focus-visible:z-10",
        "data-[variant=outline]:border-2  data-[variant=outline]:border-border hover:data-[variant=outline]:border-primary/50",
        "data-[state=on]:data-[variant=outline]:border-primary data-[state=on]:data-[variant=outline]:bg-primary/5 data-[state=on]:data-[variant=outline]:text-foreground",
        !separated &&
          "rounded-none first:rounded-l-md last:rounded-r-md data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l-2 data-[variant=outline]:data-[variant=outline]:border-l-2",
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
