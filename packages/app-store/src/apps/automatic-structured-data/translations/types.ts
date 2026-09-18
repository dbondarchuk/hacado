import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { AUTOMATIC_STRUCTURED_DATA_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";

export type AutomaticStructuredDataAdminKeys = Leaves<typeof adminKeys>;
export const automaticStructuredDataAdminNamespace =
  `app_${AUTOMATIC_STRUCTURED_DATA_APP_NAME}_admin` as const;
export type AutomaticStructuredDataAdminNamespace =
  typeof automaticStructuredDataAdminNamespace;

export type AutomaticStructuredDataAdminAllKeys = AllKeys<
  AutomaticStructuredDataAdminNamespace,
  AutomaticStructuredDataAdminKeys
>;
