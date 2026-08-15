import PageContainer from "@/components/admin/layout/page-container";
import { Breadcrumbs, Heading } from "@hacado/ui";

import { getServicesContainer } from "@/app/utils";
import { AddonForm } from "@/components/admin/services/addons/form";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type Props = PageProps<"/dashboard/services/addons/[id]">;

const getAddon = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.servicesService.getAddon(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const addon = await getAddon(id);
  return {
    title: `${addon?.name} | ${t("services.addons.title")}`,
  };
}
export default async function EditAddonPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("edit-service-addon");
  const t = await getI18nAsync("admin");
  await assertPageHasPermission("service", "update");
  const params = await props.params;

  logger.debug(
    {
      addonId: params.id,
    },
    "Loading service addon edit page",
  );

  const addon = await getAddon(params.id);

  if (!addon) {
    logger.warn({ addonId: params.id }, "Service addon not found");
    return notFound();
  }

  logger.debug(
    {
      addonId: params.id,
      addonName: addon.name,
      addonPrice: addon.price,
    },
    "Service addon edit page loaded",
  );

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    { title: t("navigation.addons"), link: "/dashboard/services/addons" },
    {
      title: addon.name,
      link: `/dashboard/services/addons/${params.id}`,
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={addon.name}
            description={t("services.addons.editDescription")}
          />

          {/* <Separator /> */}
        </div>
        <AddonForm initialData={addon} />
      </div>
    </PageContainer>
  );
}
