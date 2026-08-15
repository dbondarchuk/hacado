import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { FORMS_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";
import type publicKeys from "./en/public.generated";

export type FormsAdminKeys = Leaves<typeof adminKeys>;
export const formsAdminNamespace = `app_${FORMS_APP_NAME}_admin` as const;

export type FormsAdminNamespace = typeof formsAdminNamespace;

export type FormsPublicKeys = Leaves<typeof publicKeys>;
export const formsPublicNamespace = `app_${FORMS_APP_NAME}_public` as const;

export type FormsPublicNamespace = typeof formsPublicNamespace;

export type FormsAdminAllKeys = AllKeys<FormsAdminNamespace, FormsAdminKeys>;

export type FormsPublicAllKeys = AllKeys<FormsPublicNamespace, FormsPublicKeys>;
