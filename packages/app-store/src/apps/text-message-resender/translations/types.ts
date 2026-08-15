import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { TEXT_MESSAGE_RESENDER_APP_NAME } from "../const";
import type admin from "./en/admin.generated";

export type TextMessageResenderAdminKeys = Leaves<typeof admin>;
export const textMessageResenderAdminNamespace =
  `app_${TEXT_MESSAGE_RESENDER_APP_NAME}_admin` as const;

export type TextMessageResenderAdminNamespace =
  typeof textMessageResenderAdminNamespace;

export type TextMessageResenderAdminAllKeys = AllKeys<
  TextMessageResenderAdminNamespace,
  TextMessageResenderAdminKeys
>;
