import { getUser } from "@/app/utils";
import { FieldsTable } from "@/components/admin/catalog/fields/table/table";
import { FieldsTableAction } from "@/components/admin/catalog/fields/table/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import {
  fieldsSearchParamsCache,
  fieldsSearchParamsSerializer,
} from "@hacado/api-sdk/admin/search-params/fields";
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
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/catalog/fields">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.fields.title"),
  };
}

export default async function FieldsPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("fields");
  const t = await getI18nAsync("admin");

  logger.debug("Loading fields page");
  const searchParams = await props.searchParams;
  const parsed = fieldsSearchParamsCache.parse(searchParams);

  const key = fieldsSearchParamsSerializer({ ...parsed });
  const user = await getUser();
  const canCreate = hasPermission(user, "service", "create");

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.catalog"), link: "/dashboard/catalog" },
    { title: t("navigation.fields"), link: "/dashboard/catalog/fields" },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <FieldsTableAction
          actions={
            canCreate ? (
              <Link
                button
                href="/dashboard/catalog/fields/new"
                size="sm"
                variant="default"
                aria-label={t("catalog.fields.addNew")}
              >
                <Plus />
                <TableToolbarActionLabel>
                  {t("catalog.fields.addNew")}
                </TableToolbarActionLabel>
              </Link>
            ) : null
          }
        />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={8} rowCount={10} />}
        >
          <FieldsTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
