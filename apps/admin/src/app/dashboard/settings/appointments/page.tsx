import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import {
  getSessionPlanTier,
  sessionCanUseFeature,
} from "@/lib/billing/subscription-plan-access";
import { getI18nAsync } from "@timelish/i18n/server";
import { getLoggerFactory } from "@timelish/logger";
import { BillingPlanTier, meetsMinimumPlanTier } from "@timelish/types";
import { Breadcrumbs, Heading } from "@timelish/ui";
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
    { title: t("navigation.settings"), link: "/dashboard" },
    {
      title: t("navigation.appointments"),
      link: "/dashboard/settings/appointments",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("settings.appointments.title")}
            description={t("settings.appointments.description")}
          />
        </div>
        <AppointmentsSettingsForm
          values={booking}
          canUsePayments={canUsePayments}
          showTeamSettings={showTeamSettings}
        />
      </div>
    </PageContainer>
  );
}
