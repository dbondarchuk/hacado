import {
  getOrganizationId,
  getServicesContainer,
  getSession,
} from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getSessionPlanTier } from "@/lib/billing/subscription-plan-access";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import type { SmsOptInPreviewProps } from "@hacado/page-builder/opt-in-preview-types";
import {
  requiresSmsVerification,
  SmsRegistrationStore,
  toSmsRegistrationView,
} from "@hacado/services";
import { BillingPlanTier, meetsMinimumPlanTier } from "@hacado/types";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { getWebsiteUrl } from "@hacado/utils";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { TextMessagingSettingsForm } from "./form";
import { loadSmsOptInPreview } from "./preview-data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return { title: t("settings.textMessaging.title") };
}

export default async function Page() {
  const t = await getI18nAsync("admin");
  const session = await getSession();
  if (
    !meetsMinimumPlanTier(getSessionPlanTier(session), BillingPlanTier.Solo)
  ) {
    redirect("/dashboard");
  }

  const services = await getServicesContainer();
  const organizationId = await getOrganizationId();
  const [general, organization, record, preview] = await Promise.all([
    services.configurationService.getConfiguration("general"),
    services.organizationService.getOrganization(),
    new SmsRegistrationStore().get(organizationId),
    loadSmsOptInPreview(services).catch((error): SmsOptInPreviewProps => {
      getLoggerFactory("Admin/settings/text-messaging")("preview").warn(
        { error },
        "SMS opt-in preview used the default booking form",
      );
      return { service: null, formFields: [] };
    }),
  ]);

  const values = toSmsRegistrationView(record, {
    legalName: general.name,
    website: organization ? getWebsiteUrl(organization) : "",
    address: general.address ?? {},
    contactEmail: general.email,
    contactPhone: general.phone ?? "",
  });

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.settings"), link: "/dashboard" },
    {
      title: t("navigation.textMessaging"),
      link: "/dashboard/settings/text-messaging",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <Heading
          title={t("settings.textMessaging.title")}
          description={t("settings.textMessaging.description")}
        />
        {requiresSmsVerification(general.country) ? (
          <TextMessagingSettingsForm
            values={values}
            requiresVerification
            preview={preview}
            country={general.country}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("settings.textMessaging.countryOnly")}
          </p>
        )}
      </div>
    </PageContainer>
  );
}
