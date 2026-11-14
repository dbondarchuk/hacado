import { getUser } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Link } from "@hacado/ui/link";
import { Skeleton } from "@hacado/ui/skeleton";
import { canViewCompanyApps } from "@hacado/utils/app-access";
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
      <div className="flex w-full flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <PageHeader
          text={t("apps.description")}
          actions={
            <div className="flex items-center justify-end gap-2 py-2">
              {showCompanyTools ? (
                <Link variant="secondary" button href="/dashboard/apps/default">
                  <Boxes /> {t("apps.defaultApps")}
                </Link>
              ) : null}
              <Link variant="default" button href="/dashboard/apps/store">
                <Store /> {t("apps.appStore")}
              </Link>
            </div>
          }
        />
        <div className="grid gap-4">
          <Suspense
            fallback={Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          >
            <InstalledApps />
          </Suspense>
        </div>
      </div>
    </PageContainer>
  );
}
