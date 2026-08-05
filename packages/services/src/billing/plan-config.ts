import { BillingPlanTier } from "@hacado/types";

export type PolarBillingPlanDef = {
  slug: BillingPlanTier;
  productId: string;
};

/** Legacy env slugs kept for a smooth rename from Pro/Team. */
const LEGACY_PLAN_SLUG_ALIASES: Record<string, BillingPlanTier> = {
  pro: BillingPlanTier.Solo,
  team: BillingPlanTier.Studio,
};

function normalizePlanSlug(slug: string): BillingPlanTier | null {
  if (
    slug === BillingPlanTier.Free ||
    slug === BillingPlanTier.Solo ||
    slug === BillingPlanTier.Studio
  ) {
    return slug;
  }
  return LEGACY_PLAN_SLUG_ALIASES[slug] ?? null;
}

/**
 * Env: `POLAR_BILLING_PLANS=free:prod_xxx,solo:prod_yyy,studio:prod_zzz`
 * Legacy slugs `pro` / `team` are accepted and mapped to Solo / Studio.
 */
export function getPolarBillingPlansFromEnv(): PolarBillingPlanDef[] {
  const raw = process.env.POLAR_BILLING_PLANS?.trim();
  if (raw) {
    return raw.split(",").map((part) => {
      const [rawSlug, productId] = part.split(":").map((s) => s.trim());
      if (!rawSlug || !productId) {
        throw new Error(
          `Invalid POLAR_BILLING_PLANS entry "${part}" (expected slug:productId)`,
        );
      }
      const slug = normalizePlanSlug(rawSlug);
      if (!slug) {
        throw new Error(
          `Invalid POLAR_BILLING_PLANS slug "${rawSlug}" (expected free, solo or studio)`,
        );
      }
      return { slug, productId };
    });
  }

  throw new Error("Set POLAR_BILLING_PLANS for billing");
}

export function getBillingPlanProductIdMap(): Map<string, BillingPlanTier> {
  const map = new Map<string, BillingPlanTier>();
  for (const plan of getPolarBillingPlansFromEnv()) {
    map.set(plan.productId, plan.slug);
  }
  return map;
}

export function getBillingPlanProductIdForTier(
  tier: BillingPlanTier,
): string | null {
  const plan = getPolarBillingPlansFromEnv().find((p) => p.slug === tier);
  return plan?.productId ?? null;
}
