import { APPOINTMENT_REMINDERS_APP_NAME } from "../const";
import type {
  PrefixedKeys as AppointmentRemindersAdminAllKeys,
  Keys as AppointmentRemindersAdminKeys,
} from "./en/admin.keys";

export type { AppointmentRemindersAdminAllKeys, AppointmentRemindersAdminKeys };

export const appointmentRemindersAdminNamespace =
  `app_${APPOINTMENT_REMINDERS_APP_NAME}_admin` as const;

export type AppointmentRemindersAdminNamespace =
  typeof appointmentRemindersAdminNamespace;
