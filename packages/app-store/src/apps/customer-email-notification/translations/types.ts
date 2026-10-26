import { CUSTOMER_EMAIL_NOTIFICATION_APP_NAME } from "../const";
import type {
  PrefixedKeys as CustomerEmailNotificationAdminAllKeys,
  Keys as CustomerEmailNotificationAdminKeys,
} from "./en/admin.keys";

export type {
  CustomerEmailNotificationAdminAllKeys,
  CustomerEmailNotificationAdminKeys,
};

export const customerEmailNotificationAdminNamespace =
  `app_${CUSTOMER_EMAIL_NOTIFICATION_APP_NAME}_admin` as const;

export type CustomerEmailNotificationAdminNamespace =
  typeof customerEmailNotificationAdminNamespace;
