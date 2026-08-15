import { AllKeys } from "@hacado/i18n";
import { Leaves } from "@hacado/types";
import { STRIPE_APP_NAME } from "../const";
import type adminKeys from "./en/admin.generated";
import type publicKeys from "./en/public.generated";

export type StripeAdminKeys = Leaves<typeof adminKeys>;
export const stripeAdminNamespace = `app_${STRIPE_APP_NAME}_admin` as const;

export type StripeAdminNamespace = typeof stripeAdminNamespace;

export type StripeAdminAllKeys = AllKeys<StripeAdminNamespace, StripeAdminKeys>;

export type StripePublicKeys = Leaves<typeof publicKeys>;
export const stripePublicNamespace = `app_${STRIPE_APP_NAME}_public` as const;

export type StripePublicNamespace = typeof stripePublicNamespace;

export type StripePublicAllKeys = AllKeys<
  StripePublicNamespace,
  StripePublicKeys
>;
