import { canInstallApp } from "@timelish/app-store";
import { ServicesContainer } from "@timelish/services";
import { canUseFeature, isFreeTier } from "@timelish/services/billing";
import { BillingPlanTier, type SubscriptionFeature } from "@timelish/types";
import { headers } from "next/headers";
import { cache } from "react";

export const getOrganizationId = cache(async () => {
  const headersList = await headers();
  return headersList.get("x-organization-id") as string;
});

export const getOrganizationDomain = cache(async () => {
  const headersList = await headers();
  return headersList.get("x-organization-domain") as string;
});

export const getServicesContainer = cache(async () => {
  const organizationId = await getOrganizationId();
  return ServicesContainer(organizationId);
});

export const getWebsiteUrl = cache(async () => {
  const headersList = await headers();
  const organizationDomain = headersList.get("x-organization-domain") as string;
  const organizationSlug = headersList.get("x-organization-slug") as string;
  return organizationDomain
    ? `https://${organizationDomain}`
    : `https://${organizationSlug}.${process.env.PUBLIC_DOMAIN}`;
});

export { canInstallApp, canUseFeature, isFreeTier };

export const getPlanTier = cache(async (): Promise<BillingPlanTier | null> => {
  const headersList = await headers();
  const raw = headersList.get("x-subscription-plan-tier");
  if (
    raw === BillingPlanTier.Free ||
    raw === BillingPlanTier.Solo ||
    raw === BillingPlanTier.Studio
  ) {
    return raw;
  }
  return null;
});

export async function sessionCanUseFeature(
  feature: SubscriptionFeature,
): Promise<boolean> {
  const planTier = await getPlanTier();
  return canUseFeature(planTier, feature);
}
