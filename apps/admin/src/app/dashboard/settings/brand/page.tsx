import {
  getOrganizationIdAndSlug,
  getServicesContainer,
  getWebsiteUrl,
} from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { Metadata } from "next";
import { SiteSettingsForm } from "./site-settings-form";
import type { SiteSettingsFormValues } from "./site-settings-schema";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("settings.brand.title"),
  };
}

export default async function Page() {
  const t = await getI18nAsync("admin");

  const servicesContainer = await getServicesContainer();
  const { organizationId, organizationDomain, organizationSlug } =
    await getOrganizationIdAndSlug();

  const billingSubscriptionDetails =
    await servicesContainer.billingService.getSubscriptionDetails();

  const { general, brand, social, styling } =
    await servicesContainer.configurationService.getConfigurations(
      "general",
      "brand",
      "social",
      "styling",
    );
  const websiteUrl = await getWebsiteUrl();
  const publicDomain = process.env.PUBLIC_DOMAIN ?? "";
  const baseHost = publicDomain
    ? `${organizationSlug}.${publicDomain}`
    : organizationSlug;
  const baseUrl = `https://${baseHost}`;
  const customDomainARecordIp =
    process.env.CUSTOM_DOMAIN_A_RECORD_IP?.trim() || undefined;

  const values: SiteSettingsFormValues = {
    general,
    brand,
    social: { links: social?.links ?? [] },
    styling: styling ?? {},
  };

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.settings"), link: "/dashboard" },
    {
      title: t("navigation.brand"),
      link: "/dashboard/settings/brand",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("settings.brand.title")}
            description={t("settings.brand.description")}
          />
        </div>
        <SiteSettingsForm
          values={values}
          initialBrandLanguage={brand.language}
          customDomain={organizationDomain}
          organizationSlug={organizationSlug}
          websiteUrl={websiteUrl}
          baseHost={baseHost}
          baseUrl={baseUrl}
          customDomainARecordIp={customDomainARecordIp}
          billingSubscriptionDetails={billingSubscriptionDetails}
        />
      </div>
    </PageContainer>
  );
}
