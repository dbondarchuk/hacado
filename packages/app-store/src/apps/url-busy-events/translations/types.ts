import { URL_BUSY_EVENTS_APP_NAME } from "../const";
import type {
  PrefixedKeys as UrlBusyEventsAdminAllKeys,
  Keys as UrlBusyEventsAdminKeys,
} from "./en/admin.keys";

export type { UrlBusyEventsAdminAllKeys, UrlBusyEventsAdminKeys };

export const urlBusyEventsAdminNamespace =
  `app_${URL_BUSY_EVENTS_APP_NAME}_admin` as const;

export type UrlBusyEventsAdminNamespace = typeof urlBusyEventsAdminNamespace;
