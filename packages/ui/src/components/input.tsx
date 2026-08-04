import React from "react";

import { type VariantProps, cva } from "class-variance-authority";
import { withVariants } from "../cn/with-variants";

export const inputVariants = cva(
  [
    "flex w-full rounded-md bg-background",
    "text-base file:border-0 file:bg-background file:text-base file:font-medium file:text-foreground placeholder:text-muted-foreground",
    "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    defaultVariants: {
      h: "md",
      // h: "sm",
      variant: "default",
    },
    variants: {
      h: {
        lg: "h-10 px-4 py-2",
        md: "h-9 px-3 py-2",
        sm: "h-8 px-2 py-1.5",
        xs: "h-7 px-1.5 py-1",
      },
      variant: {
        default:
          "border border-input ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        ghost: "border-none focus-visible:ring-transparent",
      },
    },
  },
);

export type InputProps = React.ComponentPropsWithoutRef<"input"> &
  VariantProps<typeof inputVariants>;

export const Input = withVariants("input", inputVariants, ["variant", "h"]);

export type FloatingInputProps = InputProps & {
  label: string;
};

export function FloatingInput({
  id,
  className,
  label,
  ...props
}: FloatingInputProps) {
  return (
    <>
      <label
        className="absolute top-1/2 block -translate-y-1/2 cursor-text px-1 text-base text-muted-foreground/70 transition-all group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:text-sm group-focus-within:font-medium group-focus-within:text-foreground has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:text-sm has-[+input:not(:placeholder-shown)]:font-medium has-[+input:not(:placeholder-shown)]:text-foreground"
        htmlFor={id}
      >
        <span className="inline-flex bg-background px-2">{label}</span>
      </label>
      <Input id={id} className={className} placeholder="" {...props} />
    </>
  );
}
