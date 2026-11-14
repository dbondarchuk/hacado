import { getServicesContainer, getUser } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { canViewCompanyApps } from "@hacado/utils/app-access";
import { redirect } from "next/navigation";
import { DefaultAppsConfigurationForm } from "./form";

export default async function Page() {
  const logger = getLoggerFactory("AdminPages")("default");
  const user = await getUser();
  if (!canViewCompanyApps(user)) {
    redirect("/dashboard/apps");
  }

  const t = await getI18nAsync("admin");
  const servicesContainer = await getServicesContainer();
  logger.debug("Loading default page");
  const settings =
    await servicesContainer.configurationService.getConfiguration(
      "defaultApps",
    );

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.apps"), link: "/dashboard/apps" },
    {
      title: t("apps.defaultApps"),
      mobileTitle: t("apps.defaultApps"),
      link: "/dashboard/apps/default",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <PageHeader text={t("apps.defaultAppsDescription")} />
        <DefaultAppsConfigurationForm values={settings} />
      </div>
    </PageContainer>
  );
}
