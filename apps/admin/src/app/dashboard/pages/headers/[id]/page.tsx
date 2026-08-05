import PageContainer from "@/components/admin/layout/page-container";

import { getServicesContainer } from "@/app/utils";
import { PageHeaderForm } from "@/components/admin/pages/headers/form";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Styling } from "@hacado/page-builder/reader";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type Props = PageProps<"/dashboard/pages/headers/[id]">;

const getPageHeader = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.pagesService.getPageHeader(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const pageHeader = await getPageHeader(id);
  return {
    title: `${pageHeader?.name} | ${t("pages.headers.title")}`,
  };
}

export default async function EditPageHeaderPage(props: Props) {
  const logger = getLoggerFactory("AdminPageHeaders")("edit-page-header");
  const params = await props.params;

  logger.debug(
    {
      pageId: params.id,
    },
    "Loading page edit page",
  );

  const pageHeader = await getPageHeader(params.id);

  if (!pageHeader) {
    logger.warn({ pageId: params.id }, "Page header not found");
    return notFound();
  }

  const servicesContainer = await getServicesContainer();
  const styling =
    await servicesContainer.configurationService.getConfiguration("styling");

  logger.debug(
    {
      pageHeaderId: params.id,
      name: pageHeader.name,
    },
    "Page header edit page loaded",
  );

  return (
    <PageContainer scrollable>
      <Styling styling={styling} />
      <PageHeaderForm initialData={pageHeader} />
    </PageContainer>
  );
}
