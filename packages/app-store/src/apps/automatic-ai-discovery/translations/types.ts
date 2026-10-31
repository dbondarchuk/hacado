import { AUTOMATIC_AI_DISCOVERY_APP_NAME } from "../const";
import type {
  PrefixedKeys as AutomaticAiDiscoveryAdminAllKeys,
  Keys as AutomaticAiDiscoveryAdminKeys,
} from "./en/admin.keys";

export type { AutomaticAiDiscoveryAdminAllKeys, AutomaticAiDiscoveryAdminKeys };

export const automaticAiDiscoveryAdminNamespace =
  `app_${AUTOMATIC_AI_DISCOVERY_APP_NAME}_admin` as const;
export type AutomaticAiDiscoveryAdminNamespace =
  typeof automaticAiDiscoveryAdminNamespace;
