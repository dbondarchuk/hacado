import { GOOGLE_ANALYTICS_APP_NAME } from "../const";
import type {
  PrefixedKeys as GoogleAnalyticsAdminAllKeys,
  Keys as GoogleAnalyticsAdminKeys,
} from "./en/admin.keys";

export type { GoogleAnalyticsAdminAllKeys, GoogleAnalyticsAdminKeys };

export const googleAnalyticsAdminNamespace =
  `app_${GOOGLE_ANALYTICS_APP_NAME}_admin` as const;

export type GoogleAnalyticsAdminNamespace =
  typeof googleAnalyticsAdminNamespace;
