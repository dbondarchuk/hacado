import PageContainer from "@/components/admin/layout/page-container";
import { Breadcrumbs, Heading } from "@timelish/ui";

import { getServicesContainer } from "@/app/utils";
import { OptionForm } from "@/components/admin/services/options/form";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@timelish/i18n/server";
import { getLoggerFactory } from "@timelish/logger";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";
import { cache } from "react";

type Props = PageProps<"/dashboard/services/options/[id]">;

const getOption = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.servicesService.getOption(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const option = await getOption(id);
  return {
    title: `${option?.name} | ${t("services.options.title")}`,
  };
}

export default async function EditOptionPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("edit-service-option");
  const t = await getI18nAsync("admin");
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

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.options"),
      link: "/dashboard/services/options",
    },
    {
      title: option.name,
      link: `/dashboard/services/options/${params.id}`,
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={option.name}
            description={t("services.options.editDescription")}
          />

          {/* <Separator /> */}
        </div>
        <OptionForm initialData={option} />
      </div>
    </PageContainer>
  );
}
