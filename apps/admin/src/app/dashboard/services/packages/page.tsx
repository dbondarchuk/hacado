import PageContainer from "@/components/admin/layout/page-container";
import { PackagesTable } from "@/components/admin/services/packages/table/table";
import { PackagesTableAction } from "@/components/admin/services/packages/table/table-action";
import {
  packagesSearchParamsCache,
  packagesSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/services/packages">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.packages.title"),
  };
}

export default async function PackagesPage(props: Params) {
  const t = await getI18nAsync("admin");
  const searchParams = await props.searchParams;
  const parsed = packagesSearchParamsCache.parse(searchParams);
  const key = packagesSearchParamsSerializer({ ...parsed });

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.packages"),
      link: "/dashboard/services/packages",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("services.packages.title")}
            description={t("services.packages.description")}
          />
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
