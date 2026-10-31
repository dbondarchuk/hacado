import { TEXT_MESSAGE_AUTO_REPLY_APP_NAME } from "../const";
import type {
  PrefixedKeys as TextMessageAutoReplyAdminAllKeys,
  Keys as TextMessageAutoReplyAdminKeys,
} from "./en/admin.keys";

export type { TextMessageAutoReplyAdminAllKeys, TextMessageAutoReplyAdminKeys };

export const textMessageAutoReplyAdminNamespace =
  `app_${TEXT_MESSAGE_AUTO_REPLY_APP_NAME}_admin` as const;

export type TextMessageAutoReplyAdminNamespace =
  typeof textMessageAutoReplyAdminNamespace;
