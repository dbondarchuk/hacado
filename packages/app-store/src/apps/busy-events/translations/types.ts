import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { BUSY_EVENTS_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";
import type publicKeys from "./en/public.generated";

export type BusyEventsAdminKeys = Leaves<typeof adminKeys>;
export const busyEventsAdminNamespace =
  `app_${BUSY_EVENTS_APP_NAME}_admin` as const;

export type BusyEventsAdminNamespace = typeof busyEventsAdminNamespace;
export type BusyEventsAdminAllKeys = AllKeys<
  BusyEventsAdminNamespace,
  BusyEventsAdminKeys
>;

export type BusyEventsPublicKeys = Leaves<typeof publicKeys>;
export const busyEventsPublicNamespace =
  `app_${BUSY_EVENTS_APP_NAME}_public` as const;

export type BusyEventsPublicNamespace = typeof busyEventsPublicNamespace;
export type BusyEventsPublicAllKeys = AllKeys<
  BusyEventsPublicNamespace,
  BusyEventsPublicKeys
>;
