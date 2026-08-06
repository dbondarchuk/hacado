import {
  BillingPlanTier,
  getMinimumPlanTierForApp,
  meetsMinimumPlanTier,
} from "@hacado/types";
import { AvailableApps } from "./apps";

export function getAppMinimumPlanTier(appSlug: string): BillingPlanTier {
  return getMinimumPlanTierForApp(AvailableApps[appSlug]);
}

export function canInstallApp(
  planTier: BillingPlanTier | null,
  appSlug: string,
): boolean {
  return meetsMinimumPlanTier(planTier, getAppMinimumPlanTier(appSlug));
}

export function canProcessApp(
  planTier: BillingPlanTier | null,
  appSlug: string,
): boolean {
  return canInstallApp(planTier, appSlug);
}
