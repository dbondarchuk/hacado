import { canInstallApp, canProcessApp, getAppMinimumPlanTier } from "@timelish/app-store";
import {
  BRAND_SETTINGS_UPGRADE_URL,
  canUseFeature,
  isFreeTier,
  resolvePlanTierFromProductId,
} from "@timelish/services/billing";
import {
  BillingPlanTier,
  canCreateMoreServices,
  canCreateMorePages,
  DEFAULT_MINIMUM_PLAN_TIER,
  meetsMinimumPlanTier,
  type SubscriptionFeature,
} from "@timelish/types";

export {
  BRAND_SETTINGS_UPGRADE_URL,
  canCreateMorePages,
  canCreateMoreServices,
  canInstallApp,
  canProcessApp,
  canUseFeature,
  getAppMinimumPlanTier,
  isFreeTier,
  resolvePlanTierFromProductId,
};

export function getSessionPlanTier(session: {
  user: { subscriptionPlanTier?: BillingPlanTier | null; feesExempt?: boolean };
}): BillingPlanTier | null {
  const tier = (
    session.user as { subscriptionPlanTier?: BillingPlanTier | null }
  ).subscriptionPlanTier;
  if (tier) return tier;
  if (session.user.feesExempt) return BillingPlanTier.Studio;
  return null;
}

export function sessionCanUseFeature(
  session: Parameters<typeof getSessionPlanTier>[0],
  feature: SubscriptionFeature,
): boolean {
  return canUseFeature(getSessionPlanTier(session), feature);
}

export function sessionCanInstallApp(
  session: Parameters<typeof getSessionPlanTier>[0],
  appSlug: string,
): boolean {
  return canInstallApp(getSessionPlanTier(session), appSlug);
}

export function sessionCanCreateMoreServices(
  session: Parameters<typeof getSessionPlanTier>[0],
  currentCount: number,
): boolean {
  return canCreateMoreServices(getSessionPlanTier(session), currentCount);
}

export function sessionCanCreateMorePages(
  session: Parameters<typeof getSessionPlanTier>[0],
  currentCount: number,
): boolean {
  return canCreateMorePages(getSessionPlanTier(session), currentCount);
}

type NavItemWithPlanTier = {
  minimumPlanTier?: BillingPlanTier;
  href?: string;
  items?: NavItemWithPlanTier[];
  children?: NavItemWithPlanTier[];
};

function isNavItemVisibleForPlanTier(
  item: NavItemWithPlanTier,
  planTier: BillingPlanTier | null,
): boolean {
  return meetsMinimumPlanTier(
    planTier,
    item.minimumPlanTier ?? DEFAULT_MINIMUM_PLAN_TIER,
  );
}

export function filterNavItemsForPlanTier<T extends NavItemWithPlanTier>(
  items: T[],
  planTier: BillingPlanTier | null,
): T[] {
  return items
    .map((item) => {
      if (!isNavItemVisibleForPlanTier(item, planTier)) {
        return null;
      }

      const nextChildren = item.children
        ? filterNavItemsForPlanTier(item.children, planTier)
        : undefined;
      const nextItems = item.items
        ? filterNavItemsForPlanTier(item.items, planTier)
        : undefined;

      if (nextChildren !== undefined) {
        if (nextChildren.length === 0) {
          return null;
        }
        return { ...item, children: nextChildren };
      }

      if (nextItems !== undefined) {
        if (nextItems.length === 0 && !item.href) {
          return null;
        }
        return { ...item, items: nextItems };
      }

      return item;
    })
    .filter((item): item is T => item !== null);
}
