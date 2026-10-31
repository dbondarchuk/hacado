import { BillingPlanTier } from "@hacado/types/billing";
import type { Organization } from "@hacado/types/organizations";
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

export const BRAND_SETTINGS_UPGRADE_URL =
  "/dashboard/settings/brand?activeTab=general";
