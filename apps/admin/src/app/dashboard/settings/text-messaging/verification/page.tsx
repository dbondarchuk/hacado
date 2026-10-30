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
} from "@hacado/services/text-message";
import { BillingPlanTier, meetsMinimumPlanTier } from "@hacado/types/billing";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { getWebsiteUrl } from "@hacado/utils";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loadSmsOptInPreview } from "../preview-data";
import { TextMessagingVerificationForm } from "../verification-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return { title: t("settings.textMessaging.verification.title") };
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
  const general =
    await services.configurationService.getConfiguration("general");

  if (!requiresSmsVerification(general.country)) {
    redirect("/dashboard/settings/text-messaging");
  }

  const store = new SmsRegistrationStore();
  const [textMessaging, organization, record, assignedNumber, preview] =
    await Promise.all([
      services.configurationService.getConfiguration("textMessaging"),
      services.organizationService.getOrganization(),
      store.get(organizationId),
      store.getAssignedProfileNumber(organizationId),
      loadSmsOptInPreview(services).catch((error): SmsOptInPreviewProps => {
        getLoggerFactory("Admin/settings/text-messaging/verification")(
          "preview",
        ).warn({ error }, "SMS opt-in preview used the default booking form");
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

  const smsEnabled = textMessaging?.enabled === true;
  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.settings"), link: "/dashboard/settings" },
    {
      title: t("navigation.textMessaging"),
      link: "/dashboard/settings/text-messaging",
    },
    {
      title: t("settings.textMessaging.verification.title"),
      link: "/dashboard/settings/text-messaging/verification",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <Heading
          title={t("settings.textMessaging.verification.title")}
          description={t("settings.textMessaging.verification.description")}
        />
        {smsEnabled ? null : (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            {t("settings.textMessaging.verification.disabled")}{" "}
            <Link
              href="/dashboard/settings/text-messaging"
              className="font-medium underline"
            >
              {t("settings.textMessaging.title")}
            </Link>
          </p>
        )}
        <TextMessagingVerificationForm
          values={values}
          smsEnabled={smsEnabled}
          preview={preview}
          country={general.country}
          phoneNumber={assignedNumber?.phoneNumber}
        />
      </div>
    </PageContainer>
  );
}
