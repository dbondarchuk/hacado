import { CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME } from "../const";
import type {
  PrefixedKeys as CustomerWaitlistNotificationsAdminAllKeys,
  Keys as CustomerWaitlistNotificationsAdminKeys,
} from "./en/admin.keys";
import type { Keys as CustomerWaitlistNotificationsPublicKeys } from "./en/public.keys";

export type {
  CustomerWaitlistNotificationsAdminAllKeys,
  CustomerWaitlistNotificationsAdminKeys,
  CustomerWaitlistNotificationsPublicKeys,
};

export const customerWaitlistNotificationsAdminNamespace = `app_${CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME}_admin`;

export type CustomerWaitlistNotificationsAdminNamespace =
  typeof customerWaitlistNotificationsAdminNamespace;

export const customerWaitlistNotificationsPublicNamespace = `app_${CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME}_public`;

export type CustomerWaitlistNotificationsPublicNamespace =
  typeof customerWaitlistNotificationsPublicNamespace;
