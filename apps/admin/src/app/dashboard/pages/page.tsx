import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { AddPageButton } from "@/components/admin/pages/add-page-button";
import { PagesTable } from "@/components/admin/pages/table/table";
import { PagesTableAction } from "@/components/admin/pages/table/table-action";
import { sessionCanCreateMorePages } from "@/lib/billing/subscription-plan-access";
import {
  pagesSearchParamsCache,
  pagesSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/pages">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("pages.title"),
  };
}

export default async function PagesPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("pages");
  const t = await getI18nAsync("admin");
  const session = await getSession();

  logger.debug("Loading pages page");
  const searchParams = await props.searchParams;

  const parsed = pagesSearchParamsCache.parse(searchParams);
  const key = pagesSearchParamsSerializer({ ...parsed });

  const servicesContainer = await getServicesContainer();
  const { total: pageCount } = await servicesContainer.pagesService.getPages({
    limit: 0,
  });

  const canAddMore = session
    ? sessionCanCreateMorePages(session, pageCount)
    : false;

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    { title: t("pages.title"), link: "/dashboard/pages" },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("pages.title")}
              description={t("pages.managePages")}
            />

            <AddPageButton canAddMore={canAddMore} />
          </div>
        </div>
        <PagesTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={9} rowCount={10} />}
        >
          <PagesTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
