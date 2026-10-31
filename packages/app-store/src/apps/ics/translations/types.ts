import { ICS_APP_NAME } from "../const";
import type {
  PrefixedKeys as IcsAdminAllKeys,
  Keys as IcsAdminKeys,
} from "./en/admin.keys";

export type { IcsAdminAllKeys, IcsAdminKeys };

export const icsAdminNamespace = `app_${ICS_APP_NAME}_admin` as const;

export type IcsAdminNamespace = typeof icsAdminNamespace;
