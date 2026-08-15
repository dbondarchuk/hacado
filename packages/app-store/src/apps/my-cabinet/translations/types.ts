import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { MY_CABINET_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";
import type publicKeys from "./en/public.generated";

export type MyCabinetAdminKeys = Leaves<typeof adminKeys>;
export const myCabinetAdminNamespace =
  `app_${MY_CABINET_APP_NAME}_admin` as const;
export type MyCabinetAdminNamespace = typeof myCabinetAdminNamespace;

export type MyCabinetPublicKeys = Leaves<typeof publicKeys>;
export const myCabinetPublicNamespace =
  `app_${MY_CABINET_APP_NAME}_public` as const;
export type MyCabinetPublicNamespace = typeof myCabinetPublicNamespace;

export type MyCabinetAdminAllKeys = AllKeys<
  MyCabinetAdminNamespace,
  MyCabinetAdminKeys
>;
export type MyCabinetPublicAllKeys = AllKeys<
  MyCabinetPublicNamespace,
  MyCabinetPublicKeys
>;
