import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";

export type CustomerPackageEmailNotificationAdminKeys = Leaves<
  typeof adminKeys
>;
export const customerPackageEmailNotificationAdminNamespace =
  `app_${CUSTOMER_PACKAGE_EMAIL_NOTIFICATION_APP_NAME}_admin` as const;

export type CustomerPackageEmailNotificationAdminNamespace =
  typeof customerPackageEmailNotificationAdminNamespace;
export type CustomerPackageEmailNotificationAdminAllKeys = AllKeys<
  CustomerPackageEmailNotificationAdminNamespace,
  CustomerPackageEmailNotificationAdminKeys
>;
