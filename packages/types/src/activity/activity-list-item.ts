import type { Prettify } from "../utils/helpers";
import type { ActivityActorDisplay } from "./activity-actor";
import type { ActivityEntry } from "./activity-entry";

export type ActivityListItem = Prettify<
  ActivityEntry & {
    actorDisplay: ActivityActorDisplay;
  }
>;
