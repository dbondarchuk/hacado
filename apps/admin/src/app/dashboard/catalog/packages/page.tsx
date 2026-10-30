import { getUser } from "@/app/utils";
import { PackagesTable } from "@/components/admin/catalog/packages/table/table";
import { PackagesTableAction } from "@/components/admin/catalog/packages/table/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import {
  packagesSearchParamsCache,
  packagesSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { DataTableSkeleton } from "@hacado/ui-admin/data-table";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Heading } from "@hacado/ui/heading";
import { Link } from "@hacado/ui/link";
import { hasPermission } from "@hacado/utils";
import { Plus, Receipt } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/catalog/packages">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.packages.title"),
  };
}

export default async function PackagesPage(props: Params) {
  const t = await getI18nAsync("admin");
  const user = await getUser();
  const canCreate = hasPermission(user, "package", "create");
  const searchParams = await props.searchParams;
  const parsed = packagesSearchParamsCache.parse(searchParams);
  const key = packagesSearchParamsSerializer({ ...parsed });

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.catalog"), link: "/dashboard/catalog" },
    {
      title: t("navigation.packages"),
      link: "/dashboard/catalog/packages",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("catalog.packages.title")}
              description={t("catalog.packages.description")}
            />
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/dashboard/catalog/packages/sold"
                button
                variant="outline"
                aria-label={t("catalog.packages.sold.title")}
              >
                <Receipt className="h-4 w-4" />
                <span className="max-md:hidden">
                  {t("catalog.packages.sold.title")}
                </span>
              </Link>
              {canCreate ? (
                <Link
                  button
                  href="/dashboard/catalog/packages/new"
                  variant="default"
                  aria-label={t("catalog.packages.addNew")}
                >
                  <Plus className="h-4 w-4" />
                  <span className="max-md:hidden">
                    {t("catalog.packages.addNew")}
                  </span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
        <PackagesTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={8} rowCount={10} />}
        >
          <PackagesTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
