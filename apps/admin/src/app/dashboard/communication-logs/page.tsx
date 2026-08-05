import { CommunicationLogsTable } from "@/components/admin/communication-logs/table/table";
import { CommunicationLogsTableAction } from "@/components/admin/communication-logs/table/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import {
  communicationLogsSearchParamsCache,
  serializeCommunicationLogsSearchParams,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/communication-logs">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("navigation.communicationLogs"),
  };
}

export default async function CommunicationLogsPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("communication-logs");
  const t = await getI18nAsync("admin");

  logger.debug("Loading communication-logs page");
  const searchParams = await props.searchParams;
  const parsed = communicationLogsSearchParamsCache.parse(searchParams);
  const key = serializeCommunicationLogsSearchParams({ ...parsed });

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.communicationLogs"),
      link: "/dashboard/communication-logs",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <div className="flex flex-col gap-2 justify-between">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="flex items-center justify-between">
              <Heading
                title={t("navigation.communicationLogs")}
                description={t("navigation.monitorMessages")}
              />
            </div>
          </div>
        </div>
        <CommunicationLogsTableAction
          allowClearAll
          showCustomerFilter
          showParticipantTypeFilter
        />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={13} rowCount={10} />}
        >
          <CommunicationLogsTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
