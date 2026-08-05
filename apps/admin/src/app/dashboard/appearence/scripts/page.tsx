import { getServicesContainer } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { Metadata } from "next";
import { ScriptsSettingsForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("settings.scripts.title"),
  };
}

export default async function Page() {
  const logger = getLoggerFactory("AdminPages")("scripts");
  const t = await getI18nAsync("admin");

  logger.debug("Loading scripts page");
  const servicesContainer = await getServicesContainer();
  const settings =
    await servicesContainer.configurationService.getConfiguration("scripts");

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.appearance"), link: "/dashboard" },
    {
      title: t("navigation.scripts"),
      link: "/dashboard/appearence/scripts",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("settings.scripts.title")}
            description={t("settings.scripts.description")}
          />
        </div>
        <ScriptsSettingsForm values={settings} />
      </div>
    </PageContainer>
  );
}
