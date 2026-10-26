import { EMAIL_NOTIFICATION_APP_NAME } from "../const";
import type {
  PrefixedKeys as EmailNotificationAdminAllKeys,
  Keys as EmailNotificationAdminKeys,
} from "./en/admin.keys";

export type { EmailNotificationAdminAllKeys, EmailNotificationAdminKeys };

export const emailNotificationAdminNamespace =
  `app_${EMAIL_NOTIFICATION_APP_NAME}_admin` as const;

export type EmailNotificationAdminNamespace =
  typeof emailNotificationAdminNamespace;
