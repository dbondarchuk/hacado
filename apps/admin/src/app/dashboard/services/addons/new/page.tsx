import { getServicesContainer } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { AddonForm } from "@/components/admin/services/addons/form";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { AppointmentAddonUpdateModel } from "@hacado/types";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";

type Props = PageProps<"/dashboard/services/addons/new">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.addons.new"),
  };
}

export default async function NewAddonPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("new-service-addon");
  const t = await getI18nAsync("admin");
  await assertPageHasPermission("service", "create");
  const { from: fromParam } = await props.searchParams;
  const from = fromParam as string;

  logger.debug(
    {
      fromAddonId: from,
    },
    "Loading new service addon page",
  );

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    { title: t("navigation.addons"), link: "/dashboard/services/addons" },
    {
      title: t("services.addons.new"),
      link: "/dashboard/services/addons/new",
    },
  ];

  let initialData: AppointmentAddonUpdateModel | undefined = undefined;
  if (from) {
    const servicesContainer = await getServicesContainer();
    const result = await servicesContainer.servicesService.getAddon(from);
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
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("services.addons.newTitle")}
            description={t("services.addons.newDescription")}
          />
          {/* <Separator /> */}
        </div>
        <AddonForm initialData={initialData} />
      </div>
    </PageContainer>
  );
}
