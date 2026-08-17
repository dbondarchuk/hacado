import PageContainer from "@/components/admin/layout/page-container";
import { AddNewTemplateButton } from "@/components/admin/templates/add-new-template-button";
import { TemplatesTable } from "@/components/admin/templates/table/table";
import { TemplatesTableAction } from "@/components/admin/templates/table/table-action";
import {
  templateSearchParamsCache,
  templateSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/templates">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("templates.page.title"),
  };
}

export default async function EmailTemplatesPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("templates");
  const t = await getI18nAsync("admin");

  logger.debug("Loading templates page");
  const searchParams = await props.searchParams;

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.communications"),
      link: "/dashboard/communication-logs",
    },
    { title: t("navigation.templates"), link: "/dashboard/templates" },
  ];

  const parsed = templateSearchParamsCache.parse(searchParams);
  const key = templateSearchParamsSerializer({ ...parsed });

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-start justify-between">
            <Heading title={t("templates.page.title")} />

            <AddNewTemplateButton />
          </div>
        </div>
        <TemplatesTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={5} rowCount={10} />}
        >
          <TemplatesTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
