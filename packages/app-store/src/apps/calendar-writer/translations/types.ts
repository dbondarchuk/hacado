import { CALENDAR_WRITER_APP_NAME } from "../const";
import type {
  PrefixedKeys as CalendarWriterAdminAllKeys,
  Keys as CalendarWriterAdminKeys,
} from "./en/admin.keys";

export type { CalendarWriterAdminAllKeys, CalendarWriterAdminKeys };

export const calendarWriterAdminNamespace =
  `app_${CALENDAR_WRITER_APP_NAME}_admin` as const;

export type CalendarWriterAdminNamespace = typeof calendarWriterAdminNamespace;
