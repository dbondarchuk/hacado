import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";
import type publicKeys from "./en/public.generated";

export const customerWaitlistNotificationsAdminNamespace = `app_${CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME}_admin`;

export type CustomerWaitlistNotificationsAdminNamespace =
  typeof customerWaitlistNotificationsAdminNamespace;

export type CustomerWaitlistNotificationsAdminKeys = Leaves<typeof adminKeys>;

export type CustomerWaitlistNotificationsAdminAllKeys = AllKeys<
  CustomerWaitlistNotificationsAdminNamespace,
  CustomerWaitlistNotificationsAdminKeys
>;

export const customerWaitlistNotificationsPublicNamespace = `app_${CUSTOMER_WAITLIST_NOTIFICATIONS_APP_NAME}_public`;

export type CustomerWaitlistNotificationsPublicNamespace =
  typeof customerWaitlistNotificationsPublicNamespace;

export type CustomerWaitlistNotificationsPublicKeys = Leaves<typeof publicKeys>;
