"use client";

import { cn } from "@hacado/ui/cn";
import type { ReactNode } from "react";

export function AiActionLink(props: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className={cn(
        "text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-50",
        props.className,
      )}
    >
      {props.children}
    </button>
  );
}
