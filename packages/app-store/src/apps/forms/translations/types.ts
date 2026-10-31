import { FORMS_APP_NAME } from "../const";
import type {
  PrefixedKeys as FormsAdminAllKeys,
  Keys as FormsAdminKeys,
} from "./en/admin.keys";
import type {
  PrefixedKeys as FormsPublicAllKeys,
  Keys as FormsPublicKeys,
} from "./en/public.keys";

export type {
  FormsAdminAllKeys,
  FormsAdminKeys,
  FormsPublicAllKeys,
  FormsPublicKeys,
};

export const formsAdminNamespace = `app_${FORMS_APP_NAME}_admin` as const;

export type FormsAdminNamespace = typeof formsAdminNamespace;

export const formsPublicNamespace = `app_${FORMS_APP_NAME}_public` as const;

export type FormsPublicNamespace = typeof formsPublicNamespace;
