import { CARDDAV_APP_NAME } from "../const";
import type {
  PrefixedKeys as CarddavAdminAllKeys,
  Keys as CarddavAdminKeys,
} from "./en/admin.keys";

export type { CarddavAdminAllKeys, CarddavAdminKeys };

export const carddavAdminNamespace = `app_${CARDDAV_APP_NAME}_admin` as const;

export type CarddavAdminNamespace = typeof carddavAdminNamespace;
