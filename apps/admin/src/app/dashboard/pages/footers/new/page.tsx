import { getServicesContainer } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { PageFooterForm } from "@/components/admin/pages/footers/form";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Styling } from "@hacado/page-builder/reader";
import { PageFooterUpdateModel } from "@hacado/types";
import { formatArguments } from "@hacado/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = PageProps<"/dashboard/pages/footers/new">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("pages.footers.new"),
  };
}

export default async function NewPageFooterPage(props: Props) {
  const logger = getLoggerFactory("AdminPageFooters")("new-page-footer");
  const { from: fromParam } = await props.searchParams;
  const from = fromParam as string;

  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      from,
    },
    "Loading new page footer creation page",
  );

  const { general, brand, social, styling } =
    await servicesContainer.configurationService.getConfigurations(
      "general",
      "brand",
      "social",
      "styling",
    );

  const connectedApps =
    await servicesContainer.connectedAppsService.getAppsByScope(
      "ui-components",
    );

  const apps = connectedApps.map((app) => ({
    appId: app._id,
    appName: app.name,
  }));

  let initialData: PageFooterUpdateModel | undefined = undefined;
  if (from) {
    logger.debug({ from }, "Cloning page footer");
    const pageFooter = await servicesContainer.pagesService.getPageFooter(from);
    if (!pageFooter) {
      logger.warn({ from }, "Source page footer not found");
      return notFound();
    }

    const { _id: _, updatedAt: __, ...pageFooterData } = pageFooter;
    initialData = pageFooterData;
  }

  logger.debug({ apps }, "Connected apps");

  const args = formatArguments(
    {
      general,
      brand,
      social,
      now: new Date(),
    },
    brand.language,
    general.currency,
  );

  return (
    <PageContainer scrollable>
      <Styling styling={styling} />
      <PageFooterForm initialData={initialData} args={args} apps={apps} />
    </PageContainer>
  );
}
