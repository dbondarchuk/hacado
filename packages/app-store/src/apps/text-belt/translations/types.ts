import { TEXTBELT_APP_NAME } from "../const";
import type {
  PrefixedKeys as TextBeltAdminAllKeys,
  Keys as TextBeltAdminKeys,
} from "./en/admin.keys";

export type { TextBeltAdminAllKeys, TextBeltAdminKeys };

export const textBeltAdminNamespace = `app_${TEXTBELT_APP_NAME}_admin` as const;

export type TextBeltAdminNamespace = typeof textBeltAdminNamespace;
