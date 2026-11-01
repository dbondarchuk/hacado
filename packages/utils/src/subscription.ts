import type { SubscriptionFeature } from "@hacado/types/billing";
import {
  BillingPlanTier,
  FREE_TIER_DISABLED_FEATURES,
} from "@hacado/types/billing";

export function isFreeTier(planTier: BillingPlanTier | null): boolean {
  return planTier === BillingPlanTier.Free;
}

export function canUseFeature(
  planTier: BillingPlanTier | null,
  feature: SubscriptionFeature,
): boolean {
  if (!isFreeTier(planTier)) return true;

  return !FREE_TIER_DISABLED_FEATURES.has(feature);
}
