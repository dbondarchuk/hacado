import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import {
  getSessionPlanTier,
  sessionCanUseFeature,
} from "@/lib/billing/subscription-plan-access";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { BillingPlanTier, meetsMinimumPlanTier } from "@hacado/types/billing";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Metadata } from "next";
import { AppointmentsSettingsForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("settings.appointments.title"),
  };
}

export default async function Page() {
  const logger = getLoggerFactory("AdminPages")("appointments");
  const t = await getI18nAsync("admin");

  logger.debug("Loading appointments page");
  const session = await getSession();
  const canUsePayments = sessionCanUseFeature(session, "payments");
  const planTier = getSessionPlanTier(session);
  const showTeamSettings = meetsMinimumPlanTier(
    planTier,
    BillingPlanTier.Studio,
  );

  const servicesContainer = await getServicesContainer();
  const booking =
    await servicesContainer.configurationService.getConfiguration("booking");

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.settings"), link: "/dashboard/settings" },
    {
      title: t("navigation.appointments"),
      mobileTitle: t("settings.appointments.title"),
      link: "/dashboard/settings/appointments",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <AppointmentsSettingsForm
          values={booking}
          canUsePayments={canUsePayments}
          showTeamSettings={showTeamSettings}
        />
      </div>
    </PageContainer>
  );
}
