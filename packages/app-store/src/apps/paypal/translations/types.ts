import { PAYPAL_APP_NAME } from "../const";
import type {
  PrefixedKeys as PaypalAdminAllKeys,
  Keys as PaypalAdminKeys,
} from "./en/admin.keys";
import type {
  PrefixedKeys as PaypalPublicAllKeys,
  Keys as PaypalPublicKeys,
} from "./en/public.keys";

export type {
  PaypalAdminAllKeys,
  PaypalAdminKeys,
  PaypalPublicAllKeys,
  PaypalPublicKeys,
};

export const paypalAdminNamespace = `app_${PAYPAL_APP_NAME}_admin` as const;

export type PaypalAdminNamespace = typeof paypalAdminNamespace;

export const paypalPublicNamespace = `app_${PAYPAL_APP_NAME}_public` as const;

export type PaypalPublicNamespace = typeof paypalPublicNamespace;
