import PageContainer from "@/components/admin/layout/page-container";

import { getServicesContainer } from "@/app/utils";
import { AddonForm } from "@/components/admin/catalog/addons/form";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type Props = PageProps<"/dashboard/catalog/addons/[id]">;

const getAddon = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.catalogService.getAddon(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const addon = await getAddon(id);
  return {
    title: `${addon?.name} | ${t("catalog.addons.title")}`,
  };
}

export default async function EditAddonPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("edit-service-addon");
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

  return (
    <PageContainer scrollable>
      <AddonForm initialData={addon} />
    </PageContainer>
  );
}
