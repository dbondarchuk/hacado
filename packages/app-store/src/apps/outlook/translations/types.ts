import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { OUTLOOK_APP_NAME } from "../const";
import type admin from "./en/admin.generated";

export type OutlookAdminKeys = Leaves<typeof admin>;
export const outlookAdminNamespace = `app_${OUTLOOK_APP_NAME}_admin` as const;

export type OutlookAdminNamespace = typeof outlookAdminNamespace;

export type OutlookAdminAllKeys = AllKeys<
  OutlookAdminNamespace,
  OutlookAdminKeys
>;
