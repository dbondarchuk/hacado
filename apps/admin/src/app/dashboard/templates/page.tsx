import PageContainer from "@/components/admin/layout/page-container";
import { AddNewTemplateButton } from "@/components/admin/templates/add-new-template-button";
import { TemplatesTable } from "@/components/admin/templates/table/table";
import { TemplatesTableAction } from "@/components/admin/templates/table/table-action";
import {
  templateSearchParamsCache,
  templateSearchParamsSerializer,
} from "@hacado/api-sdk/admin/search-params/templates";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { DataTableSkeleton } from "@hacado/ui-admin/data-table";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
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
        <Breadcrumbs items={breadcrumbItems} />
        <TemplatesTableAction actions={<AddNewTemplateButton />} />
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
