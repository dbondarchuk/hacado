import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { TEXT_MESSAGE_NOTIFICATION_APP_NAME } from "../const";
import type admin from "./en/admin.generated";

export type TextMessageNotificationAdminKeys = Leaves<typeof admin>;
export const textMessageNotificationAdminNamespace =
  `app_${TEXT_MESSAGE_NOTIFICATION_APP_NAME}_admin` as const;

export type TextMessageNotificationAdminNamespace =
  typeof textMessageNotificationAdminNamespace;

export type TextMessageNotificationAdminAllKeys = AllKeys<
  TextMessageNotificationAdminNamespace,
  TextMessageNotificationAdminKeys
>;
