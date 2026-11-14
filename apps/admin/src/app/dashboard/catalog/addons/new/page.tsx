import { getServicesContainer } from "@/app/utils";
import { AddonForm } from "@/components/admin/catalog/addons/form";
import PageContainer from "@/components/admin/layout/page-container";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { AppointmentAddonUpdateModel } from "@hacado/types/booking";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";

type Props = PageProps<"/dashboard/catalog/addons/new">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.addons.new"),
  };
}

export default async function NewAddonPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("new-service-addon");
  await assertPageHasPermission("service", "create");
  const { from: fromParam } = await props.searchParams;
  const from = fromParam as string;

  logger.debug(
    {
      fromAddonId: from,
    },
    "Loading new service addon page",
  );

  let initialData: AppointmentAddonUpdateModel | undefined = undefined;
  if (from) {
    const servicesContainer = await getServicesContainer();
    const result = await servicesContainer.catalogService.getAddon(from);
    if (!result) {
      logger.warn({ fromAddonId: from }, "Source addon not found for copying");
      notFound();
    }

    const { _id, updatedAt, ...addon } = result;
    initialData = addon;

    logger.debug(
      {
        fromAddonId: from,
        addonName: result.name,
      },
      "Using source addon as template",
    );
  }

  logger.debug(
    {
      fromAddonId: from,
      hasInitialData: !!initialData,
    },
    "New service addon page loaded",
  );

  return (
    <PageContainer scrollable>
      <AddonForm initialData={initialData} />
    </PageContainer>
  );
}
