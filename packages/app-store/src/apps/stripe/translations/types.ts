import { STRIPE_APP_NAME } from "../const";
import type {
  PrefixedKeys as StripeAdminAllKeys,
  Keys as StripeAdminKeys,
} from "./en/admin.keys";
import type {
  PrefixedKeys as StripePublicAllKeys,
  Keys as StripePublicKeys,
} from "./en/public.keys";

export type {
  StripeAdminAllKeys,
  StripeAdminKeys,
  StripePublicAllKeys,
  StripePublicKeys,
};

export const stripeAdminNamespace = `app_${STRIPE_APP_NAME}_admin` as const;

export type StripeAdminNamespace = typeof stripeAdminNamespace;

export const stripePublicNamespace = `app_${STRIPE_APP_NAME}_public` as const;

export type StripePublicNamespace = typeof stripePublicNamespace;
