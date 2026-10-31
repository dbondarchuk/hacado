import { CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME } from "../const";
import type {
  PrefixedKeys as CustomerPackageEmailNotificationAdminAllKeys,
  Keys as CustomerPackageEmailNotificationAdminKeys,
} from "./en/admin.keys";

export type {
  CustomerPackageEmailNotificationAdminAllKeys,
  CustomerPackageEmailNotificationAdminKeys,
};

export const customerPackageEmailNotificationAdminNamespace =
  `app_${CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME}_admin` as const;

export type CustomerPackageEmailNotificationAdminNamespace =
  typeof customerPackageEmailNotificationAdminNamespace;
