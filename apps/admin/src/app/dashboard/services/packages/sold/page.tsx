import PageContainer from "@/components/admin/layout/page-container";
import { SoldPackagesTable } from "@/components/admin/services/packages/sold/table";
import { SoldPackagesTableAction } from "@/components/admin/services/packages/sold/table-action";
import {
  soldPackagesSearchParamsCache,
  soldPackagesSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/services/packages/sold">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.packages.sold.title"),
  };
}

export default async function SoldPackagesPage(props: Params) {
  const t = await getI18nAsync("admin");
  const searchParams = await props.searchParams;
  const parsed = soldPackagesSearchParamsCache.parse(searchParams);
  const key = soldPackagesSearchParamsSerializer({ ...parsed });

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.packages"),
      link: "/dashboard/services/packages",
    },
    {
      title: t("navigation.soldPackages"),
      link: "/dashboard/services/packages/sold",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("services.packages.sold.title")}
            description={t("services.packages.sold.description")}
          />
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
