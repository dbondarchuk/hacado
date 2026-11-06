import { MY_APPOINTMENT_NOTIFICATIONS_APP_NAME } from "../const";
import type {
  PrefixedKeys as MyAppointmentNotificationsAdminAllKeys,
  Keys as MyAppointmentNotificationsAdminKeys,
} from "./en/admin.keys";

export type {
  MyAppointmentNotificationsAdminAllKeys,
  MyAppointmentNotificationsAdminKeys,
};

export const myAppointmentNotificationsAdminNamespace =
  `app_${MY_APPOINTMENT_NOTIFICATIONS_APP_NAME}_admin` as const;

export type MyAppointmentNotificationsAdminNamespace =
  typeof myAppointmentNotificationsAdminNamespace;
