import type { AllKeys } from "@hacado/i18n";
import type { EventSource } from "../events/envelope";
import type { ActivitySeverity } from "./activity-severity";

/**
 * Plain copy or i18n key + args.
 */
export type ActivityTextField =
  | string
  | {
      key: AllKeys;
      args?: Record<string, any>;
    };

/**
 * Activity record derived from event definitions.
 */
export type ActivityRecord = {
  eventId: string;
  eventType: string;
  title: ActivityTextField;
  description?: ActivityTextField;
  source: EventSource;
  /** Defaults to `info` when persisted if omitted. */
  severity?: ActivitySeverity;
  metadata?: Record<string, unknown>;
  /** Dashboard deep link, e.g. `/dashboard/appointments/xyz` */
  link?: string;
};
