import { canInstallApp } from "@hacado/app-store";
import { ServicesContainer } from "@hacado/services/container";
import type { SubscriptionFeature } from "@hacado/types/billing";
import { BillingPlanTier } from "@hacado/types/billing";
import { canUseFeature } from "@hacado/utils/subscription";
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

export { canInstallApp };

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
