import PageContainer from "@/components/admin/layout/page-container";
import { PageHeadersTable } from "@/components/admin/pages/headers/table/table";
import { PageHeadersTableAction } from "@/components/admin/pages/headers/table/table-action";
import {
  pageHeadersSearchParamsCache,
  pageHeadersSearchParamsSerializer,
} from "@hacado/api-sdk/admin/search-params/pages";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import {
  DataTableSkeleton,
  TableToolbarActionLabel,
} from "@hacado/ui-admin/data-table";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Link } from "@hacado/ui/link";
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
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <PageHeadersTableAction
          actions={
            <Link
              button
              href="/dashboard/pages/headers/new"
              size="sm"
              variant="default"
              aria-label={t("pages.headers.addNew")}
            >
              <Plus />
              <TableToolbarActionLabel>
                {t("pages.headers.addNew")}
              </TableToolbarActionLabel>
            </Link>
          }
        />
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
