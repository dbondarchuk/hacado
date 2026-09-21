import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { GOOGLE_ANALYTICS_APP_NAME } from "../const";
import type admin from "./en/admin.generated";

export type GoogleAnalyticsAdminKeys = Leaves<typeof admin>;
export const googleAnalyticsAdminNamespace =
  `app_${GOOGLE_ANALYTICS_APP_NAME}_admin` as const;

export type GoogleAnalyticsAdminNamespace =
  typeof googleAnalyticsAdminNamespace;

export type GoogleAnalyticsAdminAllKeys = AllKeys<
  GoogleAnalyticsAdminNamespace,
  GoogleAnalyticsAdminKeys
>;
