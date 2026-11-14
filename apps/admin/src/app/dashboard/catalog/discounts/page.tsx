import { DiscountsTable } from "@/components/admin/catalog/discounts/table/table";
import { DiscountsTableAction } from "@/components/admin/catalog/discounts/table/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import {
  discountsSearchParamsCache,
  discountsSearchParamsSerializer,
} from "@hacado/api-sdk/admin/search-params/discounts";
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

type Params = PageProps<"/dashboard/catalog/discounts">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.discounts.title"),
  };
}

export default async function DiscountsPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("discounts");
  const t = await getI18nAsync("admin");

  logger.debug("Loading discounts page");
  const searchParams = await props.searchParams;
  const parsed = discountsSearchParamsCache.parse(searchParams);
  const key = discountsSearchParamsSerializer({ ...parsed });

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.catalog"), link: "/dashboard/catalog" },
    {
      title: t("navigation.discounts"),
      link: "/dashboard/catalog/discounts",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <DiscountsTableAction
          actions={
            <Link
              button
              href="/dashboard/catalog/discounts/new"
              size="sm"
              variant="default"
              aria-label={t("catalog.discounts.addNew")}
            >
              <Plus />
              <TableToolbarActionLabel>
                {t("catalog.discounts.addNew")}
              </TableToolbarActionLabel>
            </Link>
          }
        />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={11} rowCount={10} />}
        >
          <DiscountsTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
