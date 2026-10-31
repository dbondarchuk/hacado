import { APPOINTMENT_NOTIFICATIONS_APP_NAME } from "../const";
import type {
  PrefixedKeys as AppointmentNotificationsAdminAllKeys,
  Keys as AppointmentNotificationsAdminKeys,
} from "./en/admin.keys";

export type {
  AppointmentNotificationsAdminAllKeys,
  AppointmentNotificationsAdminKeys,
};

export const appointmentNotificationsAdminNamespace =
  `app_${APPOINTMENT_NOTIFICATIONS_APP_NAME}_admin` as const;

export type AppointmentNotificationsAdminNamespace =
  typeof appointmentNotificationsAdminNamespace;
