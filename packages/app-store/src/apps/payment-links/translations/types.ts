import { PAYMENT_LINKS_APP_NAME } from "../const";
import type {
  PrefixedKeys as PaymentLinksAdminAllKeys,
  Keys as PaymentLinksAdminKeys,
} from "./en/admin.keys";
import type {
  PrefixedKeys as PaymentLinksPublicAllKeys,
  Keys as PaymentLinksPublicKeys,
} from "./en/public.keys";

export type {
  PaymentLinksAdminAllKeys,
  PaymentLinksAdminKeys,
  PaymentLinksPublicAllKeys,
  PaymentLinksPublicKeys,
};

export const paymentLinksAdminNamespace =
  `app_${PAYMENT_LINKS_APP_NAME}_admin` as const;
export type PaymentLinksAdminNamespace = typeof paymentLinksAdminNamespace;

export const paymentLinksPublicNamespace =
  `app_${PAYMENT_LINKS_APP_NAME}_public` as const;
export type PaymentLinksPublicNamespace = typeof paymentLinksPublicNamespace;
