import { getServicesContainer, getWebsiteUrl } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { PageForm } from "@/components/admin/pages/form";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Styling } from "@hacado/page-builder/reader";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type Props = PageProps<"/dashboard/pages/[id]">;

const getPage = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.pagesService.getPage(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const page = await getPage(id);
  return {
    title: `${page?.title} | ${t("pages.title")}`,
  };
}

export default async function EditPagesPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("edit-page");
  const params = await props.params;
  const servicesContainer = await getServicesContainer();
  const websiteUrl = await getWebsiteUrl();
  logger.debug(
    {
      pageId: params.id,
    },
    "Loading page edit page",
  );

  const page = await getPage(params.id);
  const { styling, general, brand, social } =
    await servicesContainer.configurationService.getConfigurations(
      "styling",
      "general",
      "brand",
      "social",
    );

  if (!page) {
    logger.warn({ pageId: params.id }, "Page not found");
    return notFound();
  }

  const connectedApps =
    await servicesContainer.connectedAppsService.getAppsByScope(
      "ui-components",
    );

  const apps = connectedApps.map((app) => ({
    appId: app._id,
    appName: app.name,
  }));

  logger.debug({ apps }, "Connected apps");

  logger.debug(
    {
      pageId: params.id,
      pageSlug: page.slug,
      pageTitle: page.title,
      isPublished: page.published,
    },
    "Page edit page loaded",
  );

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Styling styling={styling} />
        <PageForm
          initialData={page}
          config={{ general, brand, social }}
          apps={apps}
          websiteUrl={websiteUrl}
        />
      </div>
    </PageContainer>
  );
}
