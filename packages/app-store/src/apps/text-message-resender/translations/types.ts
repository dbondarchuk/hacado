import { TEXT_MESSAGE_RESENDER_APP_NAME } from "../const";
import type {
  PrefixedKeys as TextMessageResenderAdminAllKeys,
  Keys as TextMessageResenderAdminKeys,
} from "./en/admin.keys";

export type { TextMessageResenderAdminAllKeys, TextMessageResenderAdminKeys };

export const textMessageResenderAdminNamespace =
  `app_${TEXT_MESSAGE_RESENDER_APP_NAME}_admin` as const;

export type TextMessageResenderAdminNamespace =
  typeof textMessageResenderAdminNamespace;
