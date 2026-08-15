import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { CALDAV_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";

export type CaldavAdminKeys = Leaves<typeof adminKeys>;
export const caldavAdminNamespace = `app_${CALDAV_APP_NAME}_admin` as const;

export type CaldavAdminNamespace = typeof caldavAdminNamespace;
export type CaldavAdminAllKeys = AllKeys<CaldavAdminNamespace, CaldavAdminKeys>;
