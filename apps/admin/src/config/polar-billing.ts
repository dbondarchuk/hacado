import { InstallKeys } from "@hacado/i18n";
import {
  getPolarBillingPlansFromEnv,
  PolarBillingPlanDef,
  resolvePlanTierFromProductId,
} from "@hacado/services/billing";
import { BillingPlanTier } from "@hacado/types";

export type PolarBillingPlanSlug = BillingPlanTier;
export type { PolarBillingPlanDef };

export { getPolarBillingPlansFromEnv, resolvePlanTierFromProductId };

/**
 * App-defined benefits per checkout slug (i18n keys under `install` namespace).
 * Higher tiers list only incremental benefits; UI prefixes with
 * “Everything in {lower tier} plus:”.
 */
export const POLAR_CHECKOUT_PLAN_BENEFIT_I18N_KEYS: Record<
  PolarBillingPlanSlug,
  InstallKeys[]
> = {
  free: [
    "checkout.plans.free.benefits.bookings",
    "checkout.plans.free.benefits.services",
    "checkout.plans.free.benefits.pages",
    "checkout.plans.free.benefits.branding",
    "checkout.plans.free.benefits.calendar",
    "checkout.plans.free.benefits.emailNotifications",
    "checkout.plans.free.benefits.textNotifications",
  ],
  solo: [
    "checkout.plans.solo.benefits.payments",
    "checkout.plans.solo.benefits.syncedPayments",
    "checkout.plans.solo.benefits.domain",
    "checkout.plans.solo.benefits.unlimited",
    "checkout.plans.solo.benefits.promotions",
    "checkout.plans.solo.benefits.packages",
    "checkout.plans.solo.benefits.apps",
    "checkout.plans.solo.benefits.clientPortal",
    "checkout.plans.solo.benefits.smsCredits",
  ],
  studio: [
    "checkout.plans.studio.benefits.teamMembers",
    "checkout.plans.studio.benefits.additionalSeats",
    "checkout.plans.studio.benefits.individualCalendars",
    "checkout.plans.studio.benefits.smsCredits",
  ],
};

/** Lower tier whose features are included when presenting this plan’s “plus” list. */
export const POLAR_CHECKOUT_PLAN_INCLUDES_LOWER_TIER: Partial<
  Record<PolarBillingPlanSlug, PolarBillingPlanSlug>
> = {
  solo: "free",
  studio: "solo",
};

/** Polar benefit id on the subscribed product (`meter_credit`); meter id from `sub.product.benefits`. */
export function getPolarSmsCreditsBenefitIdFromEnv(): string | undefined {
  const raw = process.env.POLAR_SMS_CREDITS_BENEFIT_ID?.trim();
  return raw || undefined;
}
