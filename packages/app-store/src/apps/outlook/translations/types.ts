import { OUTLOOK_APP_NAME } from "../const";
import type {
  PrefixedKeys as OutlookAdminAllKeys,
  Keys as OutlookAdminKeys,
} from "./en/admin.keys";

export type { OutlookAdminAllKeys, OutlookAdminKeys };

export const outlookAdminNamespace = `app_${OUTLOOK_APP_NAME}_admin` as const;

export type OutlookAdminNamespace = typeof outlookAdminNamespace;
