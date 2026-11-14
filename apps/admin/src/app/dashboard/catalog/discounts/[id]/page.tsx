import PageContainer from "@/components/admin/layout/page-container";

import { getServicesContainer } from "@/app/utils";
import { DiscountForm } from "@/components/admin/catalog/discounts/form";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";
import { cache } from "react";

type Props = PageProps<"/dashboard/catalog/discounts/[id]">;

const getDiscount = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.catalogService.getDiscount(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const discount = await getDiscount(id);
  return {
    title: `${discount?.name} | ${t("catalog.discounts.title")}`,
  };
}

export default async function EditDiscountPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("edit-service-discount");
  await assertPageHasPermission("discount", "update");
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

  return (
    <PageContainer scrollable>
      <DiscountForm initialData={discount} />
    </PageContainer>
  );
}
