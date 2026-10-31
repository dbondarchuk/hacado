import { GOOGLE_CALENDAR_APP_NAME } from "../const";
import type {
  PrefixedKeys as GoogleCalendarAdminAllKeys,
  Keys as GoogleCalendarAdminKeys,
} from "./en/admin.keys";

export type { GoogleCalendarAdminAllKeys, GoogleCalendarAdminKeys };

export const googleCalendarAdminNamespace =
  `app_${GOOGLE_CALENDAR_APP_NAME}_admin` as const;

export type GoogleCalendarAdminNamespace = typeof googleCalendarAdminNamespace;
