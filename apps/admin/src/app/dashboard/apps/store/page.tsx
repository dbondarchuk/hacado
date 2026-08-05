import { AppStore } from "@/components/admin/apps/store/app-store";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs } from "@hacado/ui";
import { Metadata } from "next";

type Params = PageProps<"/dashboard/apps/store">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("apps.appStore"),
  };
}

export default async function AppsStorePage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("store");
  const t = await getI18nAsync("admin");

  logger.debug("Loading store page");
  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.apps"), link: "/dashboard/apps" },
    { title: t("apps.appStore"), link: "/dashboard/apps/store" },
  ];

  return (
    <PageContainer scrollable>
      <Breadcrumbs items={breadcrumbItems} />
      <AppStore />
    </PageContainer>
  );
}
