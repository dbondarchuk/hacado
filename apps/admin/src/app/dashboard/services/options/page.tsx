import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { AddOptionSplitButton } from "@/components/admin/services/options/add-option-button";
import { OptionsTable } from "@/components/admin/services/options/table/table";
import { OptionsTableAction } from "@/components/admin/services/options/table/table-action";
import { sessionCanCreateMoreServices } from "@/lib/billing/subscription-plan-access";
import {
  serviceOptionsSearchParamsCache,
  serviceOptionsSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { hasPermission } from "@hacado/utils";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/services/options">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.options.title"),
  };
}

export default async function OptionsPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("options");
  const t = await getI18nAsync("admin");

  logger.debug("Loading options page");
  const searchParams = await props.searchParams;
  const parsed = serviceOptionsSearchParamsCache.parse(searchParams);

  const key = serviceOptionsSearchParamsSerializer({ ...parsed });

  const [session, servicesContainer] = await Promise.all([
    getSession(),
    getServicesContainer(),
  ]);
  const canCreate = hasPermission(session.user, "service", "create");
  const { total: serviceCount } =
    await servicesContainer.servicesService.getOptions({
      limit: 0,
    });
  const canAddMore =
    canCreate && sessionCanCreateMoreServices(session, serviceCount);

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.options"),
      link: "/dashboard/services/options",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("services.options.title")}
              description={t("services.options.description")}
            />

            {canCreate ? (
              <AddOptionSplitButton canAddMore={canAddMore} />
            ) : null}
          </div>
          {/* <Separator /> */}
        </div>
        <OptionsTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={4} rowCount={10} />}
        >
          <OptionsTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
