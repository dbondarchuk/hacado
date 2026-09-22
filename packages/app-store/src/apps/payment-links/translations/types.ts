import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { PAYMENT_LINKS_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";
import type publicKeys from "./en/public.generated";

export type PaymentLinksAdminKeys = Leaves<typeof adminKeys>;
export const paymentLinksAdminNamespace =
  `app_${PAYMENT_LINKS_APP_NAME}_admin` as const;
export type PaymentLinksAdminNamespace = typeof paymentLinksAdminNamespace;

export type PaymentLinksPublicKeys = Leaves<typeof publicKeys>;
export const paymentLinksPublicNamespace =
  `app_${PAYMENT_LINKS_APP_NAME}_public` as const;
export type PaymentLinksPublicNamespace = typeof paymentLinksPublicNamespace;

export type PaymentLinksAdminAllKeys = AllKeys<
  PaymentLinksAdminNamespace,
  PaymentLinksAdminKeys
>;
export type PaymentLinksPublicAllKeys = AllKeys<
  PaymentLinksPublicNamespace,
  PaymentLinksPublicKeys
>;
