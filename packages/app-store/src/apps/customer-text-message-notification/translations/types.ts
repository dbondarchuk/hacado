import { CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "../const";
import type {
  PrefixedKeys as CustomerTextMessageNotificationAdminAllKeys,
  Keys as CustomerTextMessageNotificationAdminKeys,
} from "./en/admin.keys";

export type {
  CustomerTextMessageNotificationAdminAllKeys,
  CustomerTextMessageNotificationAdminKeys,
};

export const customerTextMessageNotificationAdminNamespace =
  `app_${CUSTOMER_TEXT_MESSAGE_NOTIFICATION_APP_NAME}_admin` as const;

export type CustomerTextMessageNotificationAdminNamespace =
  typeof customerTextMessageNotificationAdminNamespace;
