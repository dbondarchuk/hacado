import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { SMTP_APP_NAME } from "../const";
import type admin from "./en/admin.generated";

export type SmtpAdminKeys = Leaves<typeof admin>;
export const smtpAdminNamespace = `app_${SMTP_APP_NAME}_admin` as const;

export type SmtpAdminNamespace = typeof smtpAdminNamespace;

export type SmtpAdminAllKeys = AllKeys<SmtpAdminNamespace, SmtpAdminKeys>;
