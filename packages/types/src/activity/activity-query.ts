import type { DateRange } from "../general";
import type { Query } from "../database/query";
import type { ActivitySeverity } from "./activity-severity";

export type ActivityActorFilter = "system" | "member" | "customer";

export type ActivityListQuery = Query & {
  range?: DateRange;
  eventType?: string[];
  severity?: ActivitySeverity[];
  /** Filter by `source.actor` */
  actor?: ActivityActorFilter[];
};
