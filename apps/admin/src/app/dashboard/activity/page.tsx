import { MarkAsReadEffect } from "@/components/admin/activity/mark-as-read-effect";
import { ActivityTable } from "@/components/admin/activity/table/table";
import { ActivityTableAction } from "@/components/admin/activity/table/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import {
  activitiesSearchParamsCache,
  serializeActivitiesSearchParams,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/activity">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("navigation.activity"),
  };
}

export default async function ActivityPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("activity");
  const t = await getI18nAsync("admin");

  const uniqueKey = new Date().getTime();

  const searchParams = await props.searchParams;
  const parsed = activitiesSearchParamsCache.parse(searchParams);
  const key = serializeActivitiesSearchParams({ ...parsed });

  logger.debug("Loading activity page");

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.activity"),
      link: "/dashboard/activity",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <div className="flex flex-col gap-2 justify-between">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="flex items-center justify-between">
              <Heading
                title={t("navigation.activity")}
                description={t("activity.page.description")}
              />
            </div>
          </div>
        </div>
        <ActivityTableAction />
        <MarkAsReadEffect uniqueKey={uniqueKey} />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={7} rowCount={10} />}
        >
          <ActivityTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
