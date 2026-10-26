import { SMART_SCHEDULE_APP_NAME } from "../const";
import type {
  PrefixedKeys as SmartScheduleAdminAllKeys,
  Keys as SmartScheduleAdminKeys,
} from "./en/admin.keys";

export type { SmartScheduleAdminAllKeys, SmartScheduleAdminKeys };

export const smartScheduleAdminNamespace =
  `app_${SMART_SCHEDULE_APP_NAME}_admin` as const;

export type SmartScheduleAdminNamespace = typeof smartScheduleAdminNamespace;
