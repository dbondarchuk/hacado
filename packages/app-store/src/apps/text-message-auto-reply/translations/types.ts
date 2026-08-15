import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { TEXT_MESSAGE_AUTO_REPLY_APP_NAME } from "../const";
import type admin from "./en/admin.generated";

export type TextMessageAutoReplyAdminKeys = Leaves<typeof admin>;
export const textMessageAutoReplyAdminNamespace =
  `app_${TEXT_MESSAGE_AUTO_REPLY_APP_NAME}_admin` as const;

export type TextMessageAutoReplyAdminNamespace =
  typeof textMessageAutoReplyAdminNamespace;

export type TextMessageAutoReplyAdminAllKeys = AllKeys<
  TextMessageAutoReplyAdminNamespace,
  TextMessageAutoReplyAdminKeys
>;
