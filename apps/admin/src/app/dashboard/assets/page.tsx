import { AssetsTable } from "@/components/admin/assets/table/table";
import { AssetsTableAction } from "@/components/admin/assets/table/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import {
  assetsSearchParamsCache,
  serializeAssetsSearchParams,
} from "@hacado/api-sdk/admin/search-params/assets";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import {
  DataTableSkeleton,
  TableToolbarActionLabel,
} from "@hacado/ui-admin/data-table";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Link } from "@hacado/ui/link";
import { Upload } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/assets">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("assets.title"),
  };
}

export default async function AssetsPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("assets");
  const t = await getI18nAsync("admin");

  logger.debug("Loading assets page");
  const searchParams = await props.searchParams;
  const parsed = assetsSearchParamsCache.parse(searchParams);
  const key = serializeAssetsSearchParams({ ...parsed });

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    { title: t("assets.title"), link: "/dashboard/assets" },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <AssetsTableAction
          showCustomerFilter
          actions={
            <Link
              button
              href="/dashboard/assets/new"
              size="sm"
              variant="default"
              aria-label={t("assets.addNew")}
            >
              <Upload />
              <TableToolbarActionLabel>
                {t("assets.addNew")}
              </TableToolbarActionLabel>
            </Link>
          }
        />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={10} rowCount={10} />}
        >
          <AssetsTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
