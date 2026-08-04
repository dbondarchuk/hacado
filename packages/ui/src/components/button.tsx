import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

import { cn } from "../utils";
import { TextVariants, textVariants } from "./text";

const buttonVariants = {
  primary:
    // "border border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground ",
    "bg-primary text-primary-foreground hover:brightness-[0.88]",
  default: "bg-primary text-primary-foreground hover:brightness-[0.88]",
  brand:
    "relative bg-gradient-primary dark:bg-gradient-dark text-primary-foreground z-[1] before:absolute before:inset-0 before:bg-background before:z-[-1] before:rounded-md before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:rounded-md before:bg-gradient-dark before:dark:bg-gradient-accent",
  "brand-dark":
    "relative bg-gradient-dark dark:bg-gradient-primary text-primary-foreground z-[1] before:absolute before:inset-0 before:bg-background before:z-[-1] before:rounded-md before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:rounded-md before:bg-gradient-accent before:dark:bg-gradient-primary",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline:
    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  "outline-destructive":
    "border border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  "ghost-destructive":
    "text-destructive hover:bg-destructive hover:text-destructive-foreground",
  "md-ghost-destructive":
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 md:text-destructive md:bg-transparent md:hover:bg-destructive hover:text-destructive-foreground",
  link: "text-primary underline-offset-4 hover:underline",
  "link-underline": "text-primary underline-offset-4 underline",
  "link-dashed": "text-primary underline-offset-4 underline decoration-dashed",
};

export const buttonSizes = {
  none: "",
  default: "h-9 px-4 py-2",
  // default: "h-8 rounded-md px-3 text-sm",
  xs: "h-7 rounded-md px-3 text-sm [&>svg]:size-3",
  sm: "h-8 rounded-md px-3 text-sm",
  md: "h-9 rounded-md px-5",
  lg: "h-10 rounded-md px-8",
  xl: "h-11 rounded-md px-10",
  "2xl": "h-12 rounded-md px-12 text-xl [&>svg]:size-5",
  icon: "h-8 w-8",
};

const buttonClasses = cva(
  [
    "inline-flex gap-1 [&>svg]:size-4 items-center justify-center whitespace-nowrap rounded-md text-base font-normal ring-offset-background transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    "no-underline",
  ],
  {
    variants: {
      isMenu: {
        true: "w-full cursor-pointer justify-start",
      },
      variant: buttonVariants,
      size: buttonSizes,
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariant = VariantProps<typeof buttonClasses>["variant"];
export const ButtonVariants = Object.keys(
  buttonVariants,
) as (keyof typeof buttonVariants)[];

export type ButtonSize = VariantProps<typeof buttonClasses>["size"];
export const ButtonSizes = Object.keys(
  buttonSizes,
) as (keyof typeof buttonSizes)[];

export type ButtonVariants = VariantProps<typeof buttonClasses>;

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonClasses>,
    TextVariants {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  fontSize,
  fontWeight,
  font,
  asChild = false,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        textVariants({ font, fontSize, fontWeight }),
        buttonClasses({ variant, size }),
        className,
      )}
      type={type}
      {...props}
    />
  );
}

Button.displayName = "Button";

export { Button, buttonClasses as buttonVariants };
