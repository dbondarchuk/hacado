import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { CARDDAV_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";

export type CarddavAdminKeys = Leaves<typeof adminKeys>;
export const carddavAdminNamespace = `app_${CARDDAV_APP_NAME}_admin` as const;

export type CarddavAdminNamespace = typeof carddavAdminNamespace;
export type CarddavAdminAllKeys = AllKeys<
  CarddavAdminNamespace,
  CarddavAdminKeys
>;
