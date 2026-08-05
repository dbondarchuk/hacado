import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { TEXTBELT_APP_NAME } from "../const";
import type admin from "./en/admin.generated";

export type TextBeltAdminKeys = Leaves<typeof admin>;
export const textBeltAdminNamespace = `app_${TEXTBELT_APP_NAME}_admin` as const;

export type TextBeltAdminNamespace = typeof textBeltAdminNamespace;

export type TextBeltAdminAllKeys = AllKeys<
  TextBeltAdminNamespace,
  TextBeltAdminKeys
>;
