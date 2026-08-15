import { zNonEmptyString } from "@hacado/types";
import * as z from "zod";
import type { StripeAdminAllKeys } from "./translations/types";

const stripeInStoreSyncFields = {
  /**
   * When enabled, Stripe in-store card payments are synced via webhook and
   * auto-matched to appointments.
   */
  enableInStoreSync: z.boolean().optional(),
  /**
   * How loosely (in minutes) an appointment start time may differ from the
   * transaction time to still be considered a match candidate.
   */
  matchWindowMinutes: z.coerce
    .number<number>()
    .int()
    .positive()
    .max(1440)
    .optional(),
} as const;

export const stripeAccountDataSchema = z.object({
  accountId: zNonEmptyString(
    "app_stripe_admin.validation.accountId.required" satisfies StripeAdminAllKeys,
  ),
  livemode: z.boolean().optional(),
  ...stripeInStoreSyncFields,
});

export type StripeAccountData = z.infer<typeof stripeAccountDataSchema>;

/** Admin settings saved after OAuth connect (in-store sync only). */
export const stripeSyncSettingsRequestSchema = z.object({
  ...stripeInStoreSyncFields,
});

export type StripeSyncSettingsRequest = z.infer<
  typeof stripeSyncSettingsRequestSchema
>;

export const stripeCreatePaymentIntentRequestSchema = z.object({
  paymentIntentId: zNonEmptyString(
    "app_stripe_admin.validation.paymentIntentId.required" satisfies StripeAdminAllKeys,
  ),
});

export const stripeConfirmPaymentRequestSchema = z.object({
  paymentIntentId: zNonEmptyString(
    "app_stripe_admin.validation.paymentIntentId.required" satisfies StripeAdminAllKeys,
  ),
  /** Optional Stripe PaymentIntent id when externalId is not set yet (race). */
  stripePaymentIntentId: z.string().optional(),
});

export type StripeFormProps = {
  publishableKey: string;
  /** Connect: same `acct_…` used when creating the PaymentIntent on the connected account. */
  stripeAccountId: string;
  className?: string;
};
