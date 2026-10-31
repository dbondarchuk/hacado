import { URL_SCHEDULE_PROVIDER_APP_NAME } from "../const";
import type {
  PrefixedKeys as UrlScheduleProviderAdminAllKeys,
  Keys as UrlScheduleProviderAdminKeys,
} from "./en/admin.keys";

export type { UrlScheduleProviderAdminAllKeys, UrlScheduleProviderAdminKeys };

export const urlScheduleProviderAdminNamespace =
  `app_${URL_SCHEDULE_PROVIDER_APP_NAME}_admin` as const;

export type UrlScheduleProviderAdminNamespace =
  typeof urlScheduleProviderAdminNamespace;
