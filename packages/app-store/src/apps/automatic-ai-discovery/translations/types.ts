import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { AUTOMATIC_AI_DISCOVERY_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";

export type AutomaticAiDiscoveryAdminKeys = Leaves<typeof adminKeys>;
export const automaticAiDiscoveryAdminNamespace =
  `app_${AUTOMATIC_AI_DISCOVERY_APP_NAME}_admin` as const;
export type AutomaticAiDiscoveryAdminNamespace =
  typeof automaticAiDiscoveryAdminNamespace;

export type AutomaticAiDiscoveryAdminAllKeys = AllKeys<
  AutomaticAiDiscoveryAdminNamespace,
  AutomaticAiDiscoveryAdminKeys
>;
