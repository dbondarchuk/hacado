import PageContainer from "@/components/admin/layout/page-container";
import { Breadcrumbs, Heading } from "@hacado/ui";

import { getServicesContainer } from "@/app/utils";
import { DiscountForm } from "@/components/admin/services/discounts/form";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";
import { cache } from "react";

type Props = PageProps<"/dashboard/services/discounts/[id]">;

const getDiscount = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.servicesService.getDiscount(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const discount = await getDiscount(id);
  return {
    title: `${discount?.name} | ${t("services.discounts.title")}`,
  };
}

export default async function EditDiscountPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("edit-service-discount");
  const t = await getI18nAsync("admin");
  const params = await props.params;

  logger.debug(
    {
      discountId: params.id,
    },
    "Loading service discount edit page",
  );

  const discount = await getDiscount(params.id);

  if (!discount) {
    logger.warn({ discountId: params.id }, "Service discount not found");
    return notFound();
  }

  logger.debug(
    {
      discountId: params.id,
      discountName: discount.name,
      discountType: discount.type,
      discountValue: discount.value,
    },
    "Service discount edit page loaded",
  );

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.discounts"),
      link: "/dashboard/services/discounts",
    },
    {
      title: discount.name,
      link: `/dashboard/services/discounts/${params.id}`,
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={discount.name}
            description={t("services.discounts.editDescription")}
          />
        </div>
        <DiscountForm initialData={discount} />
      </div>
    </PageContainer>
  );
}
