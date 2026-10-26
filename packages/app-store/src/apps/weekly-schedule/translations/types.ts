import { WEEKLY_SCHEDULE_APP_NAME } from "../const";
import type {
  PrefixedKeys as WeeklyScheduleAdminAllKeys,
  Keys as WeeklyScheduleAdminKeys,
} from "./en/admin.keys";

export type { WeeklyScheduleAdminAllKeys, WeeklyScheduleAdminKeys };

export const weeklyScheduleAdminNamespace =
  `app_${WEEKLY_SCHEDULE_APP_NAME}_admin` as const;

export type WeeklyScheduleAdminNamespace = typeof weeklyScheduleAdminNamespace;
