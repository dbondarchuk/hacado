import { AppDetails } from "@/components/admin/apps/store/app-details";
import PageContainer from "@/components/admin/layout/page-container";
import { AvailableApps } from "@hacado/app-store";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Metadata } from "next/types";

type Params = PageProps<"/dashboard/apps/store/[appName]">;

export async function generateMetadata(props: Params): Promise<Metadata> {
  const t = await getI18nAsync();
  const { appName } = await props.params;
  const app = AvailableApps[appName];
  return {
    title: t(app.displayName),
    description: t(app.description.text),
  };
}

export default async function AppsStorePage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("app-store-details");
  const tAdmin = await getI18nAsync("admin");
  const t = await getI18nAsync();
  const { appName } = await props.params;

  logger.debug(
    {
      appName,
    },
    "Loading app store details page",
  );

  const appDisplayName = t(AvailableApps[appName].displayName);

  const breadcrumbItems = [
    { title: tAdmin("navigation.dashboard"), link: "/dashboard" },
    { title: tAdmin("navigation.apps"), link: "/dashboard/apps" },
    { title: tAdmin("apps.appStore"), link: "/dashboard/apps/store" },
    {
      title: appDisplayName,
      mobileTitle: appDisplayName,
      link: `/dashboard/apps/store/${appName}`,
    },
  ];

  logger.debug(
    {
      appName,
      appDisplayName: AvailableApps[appName].displayName,
    },
    "App store details page loaded",
  );

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <AppDetails appName={appName} />
      </div>
    </PageContainer>
  );
}
