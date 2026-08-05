import {
  BillingPlanTier,
  FREE_TIER_DISABLED_FEATURES,
  type Organization,
  type SubscriptionFeature,
} from "@hacado/types";

import { getBillingPlanProductIdMap } from "./plan-config";

export function resolvePlanTierFromProductId(
  productId: string | null | undefined,
  options?: { feesExempt?: boolean },
): BillingPlanTier | null {
  if (options?.feesExempt === true) {
    return BillingPlanTier.Studio;
  }

  const normalized = productId?.trim();
  if (!normalized) return null;

  const tier = getBillingPlanProductIdMap().get(normalized);
  if (tier) return tier;

  // Unknown product on an active subscription defaults to Solo.
  return BillingPlanTier.Solo;
}

export function resolvePlanTierFromOrganization(
  organization: Pick<
    Organization,
    "polarSubscriptionProductId" | "feesExempt"
  > | null,
): BillingPlanTier | null {
  if (!organization) return null;
  return resolvePlanTierFromProductId(organization.polarSubscriptionProductId, {
    feesExempt: organization.feesExempt,
  });
}

export function canUseFeature(
  planTier: BillingPlanTier | null,
  feature: SubscriptionFeature,
): boolean {
  if (!isFreeTier(planTier)) return true;
  return !FREE_TIER_DISABLED_FEATURES.has(feature);
}

export function isFreeTier(planTier: BillingPlanTier | null): boolean {
  return planTier === BillingPlanTier.Free;
}

export const BRAND_SETTINGS_UPGRADE_URL =
  "/dashboard/settings/brand?activeTab=general";
