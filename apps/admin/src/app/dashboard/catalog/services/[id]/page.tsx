import PageContainer from "@/components/admin/layout/page-container";

import { getServicesContainer } from "@/app/utils";
import { ServiceForm } from "@/components/admin/catalog/services/form";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";
import { cache } from "react";

type Props = PageProps<"/dashboard/catalog/services/[id]">;

const getOption = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.catalogService.getService(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const option = await getOption(id);
  return {
    title: `${option?.name} | ${t("catalog.services.title")}`,
  };
}

export default async function ServicePage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("edit-service-option");
  await assertPageHasPermission("service", "update");
  const params = await props.params;

  logger.debug(
    {
      optionId: params.id,
    },
    "Loading service option edit page",
  );

  const option = await getOption(params.id);

  if (!option) {
    logger.warn({ optionId: params.id }, "Service option not found");
    return notFound();
  }

  logger.debug(
    {
      optionId: params.id,
      optionName: option.name,
      optionDurationType: option.durationType,
      optionDurationMin:
        option.durationType === "flexible" ? option.durationMin : undefined,
      optionDurationMax:
        option.durationType === "flexible" ? option.durationMax : undefined,
      optionDurationStep:
        option.durationType === "flexible" ? option.durationStep : undefined,
      optionPricePerHour:
        option.durationType === "flexible" ? option.pricePerHour : undefined,
      optionDuration:
        option.durationType === "fixed" ? option.duration : undefined,
      optionPrice: option.durationType === "fixed" ? option.price : undefined,
    },
    "Service option edit page loaded",
  );

  return (
    <PageContainer scrollable>
      <ServiceForm initialData={option} />
    </PageContainer>
  );
}
