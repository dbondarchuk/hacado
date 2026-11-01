"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva } from "class-variance-authority";
import React from "react";
import { useAttributeObserver } from "../hooks";
import { cn } from "../utils";
import {
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  buttonVariants,
} from "./button";
import { invalidControlClass } from "./invalid-field";

const joinBreakpoints = ["sm", "md", "lg", "xl", "2xl"] as const;

export type RadioButtonGroupJoined = boolean | (typeof joinBreakpoints)[number];

const joinedClasses =
  "w-fit flex-nowrap items-stretch gap-0 *:focus-visible:relative *:focus-visible:z-10 [&>button:not(:first-of-type)]:rounded-l-none [&>button:not(:first-of-type)]:border-l-0 [&>button:not(:last-of-type)]:rounded-r-none [&>button[data-state=checked]]:relative [&>button[data-state=checked]]:z-10";

/** Full class strings so Tailwind can see each breakpoint. */
const joinedFrom: Record<(typeof joinBreakpoints)[number], string> = {
  sm: "sm:w-fit sm:flex-nowrap sm:items-stretch sm:gap-0 sm:*:focus-visible:relative sm:*:focus-visible:z-10 sm:[&>button:not(:first-of-type)]:rounded-l-none sm:[&>button:not(:first-of-type)]:border-l-0 sm:[&>button:not(:last-of-type)]:rounded-r-none sm:[&>button[data-state=checked]]:relative sm:[&>button[data-state=checked]]:z-10",
  md: "md:w-fit md:flex-nowrap md:items-stretch md:gap-0 md:*:focus-visible:relative md:*:focus-visible:z-10 md:[&>button:not(:first-of-type)]:rounded-l-none md:[&>button:not(:first-of-type)]:border-l-0 md:[&>button:not(:last-of-type)]:rounded-r-none md:[&>button[data-state=checked]]:relative md:[&>button[data-state=checked]]:z-10",
  lg: "lg:w-fit lg:flex-nowrap lg:items-stretch lg:gap-0 lg:*:focus-visible:relative lg:*:focus-visible:z-10 lg:[&>button:not(:first-of-type)]:rounded-l-none lg:[&>button:not(:first-of-type)]:border-l-0 lg:[&>button:not(:last-of-type)]:rounded-r-none lg:[&>button[data-state=checked]]:relative lg:[&>button[data-state=checked]]:z-10",
  xl: "xl:w-fit xl:flex-nowrap xl:items-stretch xl:gap-0 xl:*:focus-visible:relative xl:*:focus-visible:z-10 xl:[&>button:not(:first-of-type)]:rounded-l-none xl:[&>button:not(:first-of-type)]:border-l-0 xl:[&>button:not(:last-of-type)]:rounded-r-none xl:[&>button[data-state=checked]]:relative xl:[&>button[data-state=checked]]:z-10",
  "2xl":
    "2xl:w-fit 2xl:flex-nowrap 2xl:items-stretch 2xl:gap-0 2xl:*:focus-visible:relative 2xl:*:focus-visible:z-10 2xl:[&>button:not(:first-of-type)]:rounded-l-none 2xl:[&>button:not(:first-of-type)]:border-l-0 2xl:[&>button:not(:last-of-type)]:rounded-r-none 2xl:[&>button[data-state=checked]]:relative 2xl:[&>button[data-state=checked]]:z-10",
};

const RadioButtonGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
    /** `true` joins at every size. A breakpoint joins from that size up. */
    joined?: RadioButtonGroupJoined;
  }
>(({ className, joined, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn(
        "flex flex-wrap gap-2",
        "aria-[invalid=true]:[&_button]:border-destructive [&[invalid]]:[&_button]:border-destructive has-[[aria-invalid=true]]:[&_button]:border-destructive has-[[invalid]]:[&_button]:border-destructive",
        joined === true && joinedClasses,
        typeof joined === "string" && joinedFrom[joined],
        className,
      )}
      {...props}
      ref={ref}
    />
  );
});

RadioButtonGroup.displayName = "RadioButtonGroup";

const buttonClasses = (
  size?: ButtonSize,
  fullWidth?: boolean,
  checkedVariant?: ButtonVariant,
  uncheckedVariant?: ButtonVariant,
) =>
  cva(fullWidth ? "w-full" : "", {
    variants: {
      variant: {
        unchecked: buttonVariants({
          variant: uncheckedVariant ?? "secondary",
          size,
        }),
        checked: buttonVariants({ variant: checkedVariant ?? "default", size }),
      },
    },
  });

const RadioButtonGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  {
    children: React.ReactNode;
    size?: ButtonProps["size"];
    fullWidth?: boolean;
    checkedVariant?: ButtonVariant;
    uncheckedVariant?: ButtonVariant;
  } & React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(
  (
    {
      className,
      children,
      size,
      fullWidth,
      checkedVariant,
      uncheckedVariant,
      ...props
    },
    ref,
  ) => {
    const [current, setCurrent] = React.useState<HTMLButtonElement | null>();

    React.useImperativeHandle(ref, () => current!);

    const state = useAttributeObserver(current || null, "data-state");

    return (
      <RadioGroupPrimitive.Item
        ref={(node) => {
          setCurrent(node);
        }}
        className={cn(
          state === "checked"
            ? buttonClasses(
                size,
                fullWidth,
                checkedVariant,
                uncheckedVariant,
              )({ variant: "checked" })
            : buttonClasses(
                size,
                fullWidth,
                checkedVariant,
                uncheckedVariant,
              )({ variant: "unchecked" }),
          // "border data-[state=checked]:bg-background text-center rounded-md focus:outline-none 2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          invalidControlClass,
          className,
        )}
        {...props}
      >
        <RadioGroupPrimitive.RadioGroupIndicator className="relative">
          {/* <div className="relative">
          <div className="absolute -ml-2 -mt-[30px] ">
            <Icons.checkCircle className="text-primary" />
          </div>
        </div> */}
        </RadioGroupPrimitive.RadioGroupIndicator>

        {children}
      </RadioGroupPrimitive.Item>
    );
  },
);

RadioButtonGroupItem.displayName = "RadioButtonGroupItem";

export { RadioButtonGroup, RadioButtonGroupItem };
