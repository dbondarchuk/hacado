import { CUSTOMER_APPOINTMENT_UPDATES_APP_NAME } from "../const";
import type {
  PrefixedKeys as CustomerAppointmentUpdatesAdminAllKeys,
  Keys as CustomerAppointmentUpdatesAdminKeys,
} from "./en/admin.keys";

export type {
  CustomerAppointmentUpdatesAdminAllKeys,
  CustomerAppointmentUpdatesAdminKeys,
};

export const customerAppointmentUpdatesAdminNamespace =
  `app_${CUSTOMER_APPOINTMENT_UPDATES_APP_NAME}_admin` as const;

export type CustomerAppointmentUpdatesAdminNamespace =
  typeof customerAppointmentUpdatesAdminNamespace;
