import { TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "../const";
import type {
  PrefixedKeys as TextMessageNotificationAdminAllKeys,
  Keys as TextMessageNotificationAdminKeys,
} from "./en/admin.keys";

export type {
  TextMessageNotificationAdminAllKeys,
  TextMessageNotificationAdminKeys,
};

export const textMessageNotificationAdminNamespace =
  `app_${TEXT_MESSAGE_NOTIFICATION_APP_NAME}_admin` as const;

export type TextMessageNotificationAdminNamespace =
  typeof textMessageNotificationAdminNamespace;
