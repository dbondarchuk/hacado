import type { ScheduleDaySource } from "@hacado/types";

/** Block / chip colors aligned with weekly-schedule source badges. */
export const scheduleSourceBlockClass: Record<ScheduleDaySource, string> = {
  default:
    "bg-secondary border-secondary/70 text-secondary-foreground hover:bg-secondary/80",
  company: "bg-primary/40 border-primary/40 hover:bg-primary/50",
  member:
    "bg-background border-2 border-foreground/35 text-foreground hover:bg-muted",
  app: "bg-destructive/40 border-destructive/40 hover:bg-destructive/50",
  holiday:
    "bg-destructive/25 border-destructive/50 border-dashed text-destructive-foreground hover:bg-destructive/35",
};

export const scheduleSourceBlockActiveClass: Record<ScheduleDaySource, string> =
  {
    default:
      "bg-secondary border-secondary text-secondary-foreground shadow-lg z-20",
    company: "bg-primary/60 border-primary shadow-lg z-20",
    member:
      "bg-muted border-2 border-foreground/50 text-foreground shadow-lg z-20",
    app: "bg-destructive/60 border-destructive shadow-lg z-20",
    holiday:
      "bg-destructive/40 border-destructive border-dashed shadow-lg z-20",
  };
