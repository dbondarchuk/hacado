import PageContainer from "@/components/admin/layout/page-container";
import { PageFootersTable } from "@/components/admin/pages/footers/table/table";
import { PageFootersTableAction } from "@/components/admin/pages/footers/table/table-action";
import {
  pageFootersSearchParamsCache,
  pageFootersSearchParamsSerializer,
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

type Params = PageProps<"/dashboard/pages/footers">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("pages.footers.title"),
  };
}

export default async function PageFootersPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("footers");
  const t = await getI18nAsync("admin");

  logger.debug("Loading page footers page");
  const searchParams = await props.searchParams;
  const parsed = pageFootersSearchParamsCache.parse(searchParams);

  const key = pageFootersSearchParamsSerializer({ ...parsed });

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    { title: t("pages.title"), link: "/dashboard/pages" },
    { title: t("pages.footers.title"), link: "/dashboard/pages/footers" },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <PageFootersTableAction
          actions={
            <Link
              button
              href="/dashboard/pages/footers/new"
              size="sm"
              variant="default"
              aria-label={t("pages.footers.addNew")}
            >
              <Plus />
              <TableToolbarActionLabel>
                {t("pages.footers.addNew")}
              </TableToolbarActionLabel>
            </Link>
          }
        />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={5} rowCount={10} />}
        >
          <PageFootersTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
