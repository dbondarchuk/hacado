import PageContainer from "@/components/admin/layout/page-container";
import { PageHeadersTable } from "@/components/admin/pages/headers/table/table";
import { PageHeadersTableAction } from "@/components/admin/pages/headers/table/table-action";
import {
  pageHeadersSearchParamsCache,
  pageHeadersSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading, Link } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { Plus } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("pages.headers.title"),
  };
}

export default async function PageHeadersPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("headers");
  const t = await getI18nAsync("admin");

  logger.debug("Loading page headers page");
  const searchParams = await props.searchParams;
  const parsed = pageHeadersSearchParamsCache.parse(searchParams);

  const key = pageHeadersSearchParamsSerializer({ ...parsed });

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    { title: t("pages.title"), link: "/dashboard/pages" },
    { title: t("pages.headers.title"), link: "/dashboard/pages/headers" },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("pages.headers.title")}
              description={t("pages.headers.managePageHeaders")}
            />

            <Link
              button
              href={"/dashboard/pages/headers/new"}
              variant="default"
            >
              <Plus /> {t("pages.headers.addNew")}
            </Link>
          </div>
        </div>
        <PageHeadersTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={5} rowCount={10} />}
        >
          <PageHeadersTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
