import { CUSTOM_SCRIPTS_APP_NAME } from "../const";
import type {
  PrefixedKeys as CustomScriptsAdminAllKeys,
  Keys as CustomScriptsAdminKeys,
} from "./en/admin.keys";

export type { CustomScriptsAdminAllKeys, CustomScriptsAdminKeys };

export const customScriptsAdminNamespace =
  `app_${CUSTOM_SCRIPTS_APP_NAME}_admin` as const;

export type CustomScriptsAdminNamespace = typeof customScriptsAdminNamespace;
