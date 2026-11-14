import { getSession } from "@/app/utils";
import { CustomersTableColumnLength } from "@/components/admin/customers/table/columns";
import { CustomersTable } from "@/components/admin/customers/table/table";
import { CustomersTableAction } from "@/components/admin/customers/table/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import {
  customersSearchParamsCache,
  customersSearchParamsSerializer,
} from "@hacado/api-sdk/admin/search-params/customers";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import {
  DataTableSkeleton,
  TableToolbarActionLabel,
} from "@hacado/ui-admin/data-table";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Link } from "@hacado/ui/link";
import { hasPermission } from "@hacado/utils/permissions";
import { Plus } from "lucide-react";
import { Metadata } from "next/types";
import { Suspense } from "react";

type Params = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("customers.title"),
  };
}

export default async function CustomersPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("customers");
  const t = await getI18nAsync("admin");
  const searchParams = await props.searchParams;
  const parsed = customersSearchParamsCache.parse(searchParams);
  const key = customersSearchParamsSerializer({ ...parsed });
  const session = await getSession();
  const canCreate = hasPermission(session.user, "customer", "create");

  logger.debug(
    {
      searchParams: parsed,
      key,
    },
    "Loading customers page",
  );

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    { title: t("customers.title"), link: "/dashboard/customers" },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <CustomersTableAction
          actions={
            canCreate ? (
              <Link
                button
                href="/dashboard/customers/new"
                size="sm"
                variant="default"
                aria-label={t("customers.addNew")}
              >
                <Plus />
                <TableToolbarActionLabel>
                  {t("customers.addNew")}
                </TableToolbarActionLabel>
              </Link>
            ) : null
          }
        />
        <Suspense
          key={key}
          fallback={
            <DataTableSkeleton
              columnCount={CustomersTableColumnLength}
              rowCount={10}
            />
          }
        >
          <CustomersTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
