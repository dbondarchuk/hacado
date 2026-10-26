import { SMTP_APP_NAME } from "../const";
import type {
  PrefixedKeys as SmtpAdminAllKeys,
  Keys as SmtpAdminKeys,
} from "./en/admin.keys";

export type { SmtpAdminAllKeys, SmtpAdminKeys };

export const smtpAdminNamespace = `app_${SMTP_APP_NAME}_admin` as const;

export type SmtpAdminNamespace = typeof smtpAdminNamespace;
