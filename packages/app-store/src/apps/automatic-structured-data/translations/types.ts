import { AUTOMATIC_STRUCTURED_DATA_APP_NAME } from "../const";
import type {
  PrefixedKeys as AutomaticStructuredDataAdminAllKeys,
  Keys as AutomaticStructuredDataAdminKeys,
} from "./en/admin.keys";

export type {
  AutomaticStructuredDataAdminAllKeys,
  AutomaticStructuredDataAdminKeys,
};

export const automaticStructuredDataAdminNamespace =
  `app_${AUTOMATIC_STRUCTURED_DATA_APP_NAME}_admin` as const;

export type AutomaticStructuredDataAdminNamespace =
  typeof automaticStructuredDataAdminNamespace;
