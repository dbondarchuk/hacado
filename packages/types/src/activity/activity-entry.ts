import { WithDatabaseId, WithOrganizationId } from "../database";
import { Prettify } from "../utils/helpers";
import type { ActivityRecord } from "./activity-record";

export type ActivityEntry = Prettify<
  WithOrganizationId<
    WithDatabaseId<
      Omit<ActivityRecord, "noExpiry"> & {
        createdAt: Date;
        /** Set at insert unless `noExpiry` is set. Omitted for permanent audit history. */
        expiresAt?: Date;
      }
    >
  >
>;
