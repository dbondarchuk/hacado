import React from "react";
import { cn } from "../utils";
import { invalidGroupedClass } from "./invalid-field";

/** Bordered shell for a textarea + footer toolbar (AI chat composer pattern). */
export const TextareaGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="textarea-group"
    className={cn(
      "border-input bg-background rounded-md border",
      "focus-within:ring-ring focus-within:ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2",
      invalidGroupedClass,
      className,
    )}
    {...props}
  />
));

TextareaGroup.displayName = "TextareaGroup";

/** Classes to strip default Textarea chrome when nested in TextareaGroup. */
export const textareaGroupControlClassName =
  "border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none";

export const TextareaGroupHeader = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    data-slot="textarea-group-header"
    className={cn(
      "flex min-w-0 items-center gap-2 border-b border-border/60 px-2 pb-2 pt-2",
      className,
    )}
    {...props}
  />
);

TextareaGroupHeader.displayName = "TextareaGroupHeader";

export const TextareaGroupFooter = ({
  className,
  ...props
}: React.ComponentProps<"div">) => (
  <div
    data-slot="textarea-group-footer"
    className={cn(
      "flex items-center justify-between gap-2 px-2 pb-2 pt-1",
      className,
    )}
    {...props}
  />
);

TextareaGroupFooter.displayName = "TextareaGroupFooter";
