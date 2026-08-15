import { WithDatabaseId, WithOrganizationId } from "../database";
import { Prettify } from "../utils/helpers";
import type { ActivityRecord } from "./activity-record";

export type ActivityEntry = Prettify<
  WithOrganizationId<
    WithDatabaseId<
      ActivityRecord & {
        createdAt: Date;
      }
    >
  >
>;
