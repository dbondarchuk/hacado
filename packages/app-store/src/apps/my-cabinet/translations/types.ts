import { MY_CABINET_APP_NAME } from "../const";
import type {
  PrefixedKeys as MyCabinetAdminAllKeys,
  Keys as MyCabinetAdminKeys,
} from "./en/admin.keys";
import type {
  PrefixedKeys as MyCabinetPublicAllKeys,
  Keys as MyCabinetPublicKeys,
} from "./en/public.keys";

export type {
  MyCabinetAdminAllKeys,
  MyCabinetAdminKeys,
  MyCabinetPublicAllKeys,
  MyCabinetPublicKeys,
};

export const myCabinetAdminNamespace =
  `app_${MY_CABINET_APP_NAME}_admin` as const;

export type MyCabinetAdminNamespace = typeof myCabinetAdminNamespace;

export const myCabinetPublicNamespace =
  `app_${MY_CABINET_APP_NAME}_public` as const;

export type MyCabinetPublicNamespace = typeof myCabinetPublicNamespace;
