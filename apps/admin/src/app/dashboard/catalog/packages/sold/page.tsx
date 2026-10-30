import { SellPackageButton } from "@/components/admin/catalog/packages/sold/sell-button";
import { SoldPackagesTable } from "@/components/admin/catalog/packages/sold/table";
import { SoldPackagesTableAction } from "@/components/admin/catalog/packages/sold/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import {
  soldPackagesSearchParamsCache,
  soldPackagesSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { DataTableSkeleton } from "@hacado/ui-admin/data-table";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Heading } from "@hacado/ui/heading";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/catalog/packages/sold">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.packages.sold.title"),
  };
}

export default async function SoldPackagesPage(props: Params) {
  const t = await getI18nAsync("admin");
  const searchParams = await props.searchParams;
  const parsed = soldPackagesSearchParamsCache.parse(searchParams);
  const key = soldPackagesSearchParamsSerializer({ ...parsed });

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.catalog"), link: "/dashboard/catalog" },
    {
      title: t("navigation.packages"),
      link: "/dashboard/catalog/packages",
    },
    {
      title: t("navigation.soldPackages"),
      link: "/dashboard/catalog/packages/sold",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("catalog.packages.sold.title")}
              description={t("catalog.packages.sold.description")}
            />
            <SellPackageButton />
          </div>
        </div>
        <SoldPackagesTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={8} rowCount={10} />}
        >
          <SoldPackagesTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
