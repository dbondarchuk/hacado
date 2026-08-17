import { getServicesContainer } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { Metadata } from "next";
import { ScheduleSettingsForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("settings.schedule.title"),
  };
}

export default async function Page() {
  const logger = getLoggerFactory("AdminPages")("schedule");
  const t = await getI18nAsync("admin");

  logger.debug("Loading schedule page");
  const servicesContainer = await getServicesContainer();
  const schedule =
    await servicesContainer.configurationService.getConfiguration("schedule");

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.schedule"),
      link: "/dashboard/settings/schedule",
    },
    {
      title: t("navigation.defaultSchedule"),
      link: "/dashboard/settings/schedule",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("settings.schedule.title")}
            description={t("settings.schedule.description")}
          />
        </div>
        <ScheduleSettingsForm values={schedule} />
      </div>
    </PageContainer>
  );
}
