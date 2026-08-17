import {
  getCalendarEventColorStyles,
  type CalendarEventColorStatus,
} from "@hacado/utils";
import type { CSSProperties } from "react";
import type { CalendarEventVariant, EventCalendarEvent } from "./types";

export const EventVariantClasses: Record<CalendarEventVariant, string> = {
  /** Confirmed appointments - soft sage */
  primary:
    "bg-primary/15 text-foreground hover:bg-primary/25 border border-primary/25 dark:bg-primary/20 dark:text-foreground dark:border-primary/30 dark:hover:bg-primary/30",
  /** Pending appointments - ochre accent stripe */
  secondary:
    "bg-brand/15 text-foreground hover:bg-brand/25 border border-brand/25 border-l-[3px] border-l-brand dark:bg-brand/20 dark:text-foreground dark:border-brand/30 dark:border-l-brand dark:hover:bg-brand/30",
  /** Third-party / external calendar events */
  tertiary:
    "bg-sky-100/90 text-sky-950 hover:bg-sky-200/90 border border-sky-200/60 dark:bg-sky-900/40 dark:text-sky-50 dark:border-sky-800/50 dark:hover:bg-sky-900/60",
  destructive:
    "bg-rose-100/90 text-rose-950 hover:bg-rose-200/90 border border-rose-200/60 dark:bg-rose-900/40 dark:text-rose-50 dark:border-rose-800/50 dark:hover:bg-rose-900/60",
  /** Currently selected / edited appointment */
  current:
    "bg-primary/90 text-primary-foreground hover:bg-primary border-2 border-primary shadow-sm dark:bg-primary/25 dark:hover:bg-primary/35",
};

const COLORABLE_VARIANTS = new Set<CalendarEventVariant>([
  "primary",
  "secondary",
  "destructive",
  "current",
]);

function variantToColorStatus(
  variant: CalendarEventVariant,
): CalendarEventColorStatus {
  switch (variant) {
    case "secondary":
      return "pending";
    case "destructive":
      return "declined";
    default:
      return "confirmed";
  }
}

export type EventAppearance = {
  className: string;
  style?: CSSProperties;
};

/**
 * Resolve Tailwind classes + optional member-color inline styles for an event.
 */
export function getEventAppearance(
  event: Pick<EventCalendarEvent, "variant" | "color">,
): EventAppearance {
  const variant = event.variant || "primary";

  if (event.color && COLORABLE_VARIANTS.has(variant)) {
    const tint = getCalendarEventColorStyles(
      event.color,
      variantToColorStatus(variant),
    );

    const style: CSSProperties =
      variant === "current"
        ? {
            backgroundColor: tint.backgroundColor,
            color: tint.color,
          }
        : {
            backgroundColor: tint.backgroundColor,
            color: tint.color,
            borderColor: tint.borderColor,
            ...(tint.borderLeftColor
              ? { borderLeftColor: tint.borderLeftColor }
              : {}),
          };

    const statusClasses =
      variant === "secondary"
        ? "border border-l-[3px]"
        : variant === "destructive"
          ? "border border-l-[3px] opacity-80 line-through"
          : variant === "current"
            ? "border-2 border-primary shadow-sm"
            : "border";

    return {
      className: statusClasses,
      style,
    };
  }

  return {
    className: EventVariantClasses[variant] ?? EventVariantClasses.primary,
  };
}
