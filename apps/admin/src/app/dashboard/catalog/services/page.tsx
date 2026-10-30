import { getServicesContainer, getSession } from "@/app/utils";
import { AddServiceSplitButton } from "@/components/admin/catalog/services/add-service-button";
import { ServicesTable } from "@/components/admin/catalog/services/table/table";
import { ServicesTableAction } from "@/components/admin/catalog/services/table/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import { sessionCanCreateMoreServices } from "@/lib/billing/subscription-plan-access";
import {
  servicesSearchParamsCache,
  servicesSearchParamsSerializer,
} from "@hacado/api-sdk/admin/search-params/services";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { DataTableSkeleton } from "@hacado/ui-admin/data-table";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Heading } from "@hacado/ui/heading";
import { hasPermission } from "@hacado/utils/permissions";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/catalog/services">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.services.title"),
  };
}

export default async function ServicesPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("options");
  const t = await getI18nAsync("admin");

  logger.debug("Loading options page");
  const searchParams = await props.searchParams;
  const parsed = servicesSearchParamsCache.parse(searchParams);

  const key = servicesSearchParamsSerializer({ ...parsed });

  const [session, servicesContainer] = await Promise.all([
    getSession(),
    getServicesContainer(),
  ]);
  const canCreate = hasPermission(session.user, "service", "create");
  const { total: serviceCount } =
    await servicesContainer.catalogService.getServices({
      limit: 0,
    });
  const canAddMore =
    canCreate && sessionCanCreateMoreServices(session, serviceCount);

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.catalog"), link: "/dashboard/catalog" },
    {
      title: t("navigation.services"),
      link: "/dashboard/catalog/services",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("catalog.services.title")}
              description={t("catalog.services.description")}
            />

            {canCreate ? (
              <AddServiceSplitButton canAddMore={canAddMore} />
            ) : null}
          </div>
          {/* <Separator /> */}
        </div>
        <ServicesTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={4} rowCount={10} />}
        >
          <ServicesTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
