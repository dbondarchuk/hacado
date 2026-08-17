import { getUser } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading, Link, Skeleton } from "@hacado/ui";
import { canViewCompanyApps } from "@hacado/utils";
import { Boxes, Store } from "lucide-react";
import { Metadata } from "next/types";
import { Suspense } from "react";
import { InstalledApps } from "./installed-apps";

type Params = PageProps<"/dashboard/apps">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("navigation.apps"),
  };
}

export default async function AppsPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("apps");
  const t = await getI18nAsync("admin");
  const user = await getUser();
  const showCompanyTools = canViewCompanyApps(user);

  logger.debug("Loading apps page");
  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.apps"), link: "/dashboard/apps" },
  ];
  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("apps.heading")}
              description={t("apps.description")}
            />

            <div className="flex flex-col [&>a]:max-md:w-full md:flex-row gap-2 items-center">
              {showCompanyTools && (
                <Link variant="secondary" button href="/dashboard/apps/default">
                  <Boxes /> {t("apps.defaultApps")}
                </Link>
              )}
              <Link variant="default" button href="/dashboard/apps/store">
                <Store /> {t("apps.appStore")}
              </Link>
            </div>
          </div>
        </div>
        <div className="grid  gap-4">
          <Suspense
            fallback={Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="w-full h-32" />
            ))}
          >
            <InstalledApps />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
