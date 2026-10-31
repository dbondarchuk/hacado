import { BUSY_EVENTS_APP_NAME } from "../const";
import type {
  PrefixedKeys as BusyEventsAdminAllKeys,
  Keys as BusyEventsAdminKeys,
} from "./en/admin.keys";
import type {
  PrefixedKeys as BusyEventsPublicAllKeys,
  Keys as BusyEventsPublicKeys,
} from "./en/public.keys";

export type {
  BusyEventsAdminAllKeys,
  BusyEventsAdminKeys,
  BusyEventsPublicAllKeys,
  BusyEventsPublicKeys,
};

export const busyEventsAdminNamespace =
  `app_${BUSY_EVENTS_APP_NAME}_admin` as const;

export type BusyEventsAdminNamespace = typeof busyEventsAdminNamespace;

export const busyEventsPublicNamespace =
  `app_${BUSY_EVENTS_APP_NAME}_public` as const;

export type BusyEventsPublicNamespace = typeof busyEventsPublicNamespace;
