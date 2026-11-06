import { TEXT_MESSAGE_FORWARDING_APP_NAME } from "../const";
export type {
  PrefixedKeys as TextMessageForwardingAdminAllKeys,
  Keys as TextMessageForwardingAdminKeys,
} from "./en/admin.keys";

export const textMessageForwardingAdminNamespace =
  `app_${TEXT_MESSAGE_FORWARDING_APP_NAME}_admin` as const;

export type TextMessageForwardingAdminNamespace =
  typeof textMessageForwardingAdminNamespace;
