import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { URL_SCHEDULE_PROVIDER_APP_NAME } from "../const";
import type admin from "./en/admin.generated";

export type UrlScheduleProviderAdminKeys = Leaves<typeof admin>;
export const urlScheduleProviderAdminNamespace =
  `app_${URL_SCHEDULE_PROVIDER_APP_NAME}_admin` as const;

export type UrlScheduleProviderAdminNamespace =
  typeof urlScheduleProviderAdminNamespace;

export type UrlScheduleProviderAdminAllKeys = AllKeys<
  UrlScheduleProviderAdminNamespace,
  UrlScheduleProviderAdminKeys
>;
