import { CALDAV_APP_NAME } from "../const";
import type {
  PrefixedKeys as CaldavAdminAllKeys,
  Keys as CaldavAdminKeys,
} from "./en/admin.keys";

export type { CaldavAdminAllKeys, CaldavAdminKeys };

export const caldavAdminNamespace = `app_${CALDAV_APP_NAME}_admin` as const;

export type CaldavAdminNamespace = typeof caldavAdminNamespace;
