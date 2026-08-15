import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { PAYPAL_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";
import type publicKeys from "./en/public.generated";

export type PaypalAdminKeys = Leaves<typeof adminKeys>;
export const paypalAdminNamespace = `app_${PAYPAL_APP_NAME}_admin` as const;

export type PaypalAdminNamespace = typeof paypalAdminNamespace;

export type PaypalAdminAllKeys = AllKeys<PaypalAdminNamespace, PaypalAdminKeys>;

export type PaypalPublicKeys = Leaves<typeof publicKeys>;
export const paypalPublicNamespace = `app_${PAYPAL_APP_NAME}_public` as const;

export type PaypalPublicNamespace = typeof paypalPublicNamespace;

export type PaypalPublicAllKeys = AllKeys<
  PaypalPublicNamespace,
  PaypalPublicKeys
>;
