"use client";

import { cn } from "@hacado/ui";
import type { ReactNode } from "react";
import { AccordionProvider } from "./context";
import { AccordionProps } from "./schema";

export function AccordionClient({
  className,
  id,
  allowMultipleOpen,
  initialOpenItemIds,
  animation,
  iconPosition,
  iconStyle,
  children,
}: {
  className?: string;
  id?: string;
  allowMultipleOpen?: boolean | null;
  initialOpenItemIds: string[];
  animation?: AccordionProps["props"]["animation"];
  iconPosition?: AccordionProps["props"]["iconPosition"];
  iconStyle?: AccordionProps["props"]["iconStyle"];
  children: ReactNode;
}) {
  return (
    <AccordionProvider
      allowMultipleOpen={allowMultipleOpen}
      initialOpenItemIds={initialOpenItemIds}
      animation={animation}
      iconPosition={iconPosition}
      iconStyle={iconStyle}
    >
      <div className={cn(className)} id={id}>
        {children}
      </div>
    </AccordionProvider>
  );
}
