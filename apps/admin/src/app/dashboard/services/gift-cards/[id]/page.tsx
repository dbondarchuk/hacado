import PageContainer from "@/components/admin/layout/page-container";
import { Breadcrumbs, Heading } from "@hacado/ui";

import { getServicesContainer } from "@/app/utils";
import { GiftCardForm } from "@/components/admin/services/gift-cards/form";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";
import { cache } from "react";

type Props = PageProps<"/dashboard/services/gift-cards/[id]">;

const getGiftCard = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.giftCardsService.getGiftCard(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const giftCard = await getGiftCard(id);
  return {
    title: `${giftCard?.code} | ${t("services.giftCards.title")}`,
  };
}

export default async function EditGiftCardPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("edit-service-gift-card");
  const t = await getI18nAsync("admin");
  const params = await props.params;

  logger.debug(
    {
      giftCardId: params.id,
    },
    "Loading service gift card edit page",
  );

  const giftCard = await getGiftCard(params.id);

  if (!giftCard) {
    logger.warn({ giftCardId: params.id }, "Service gift card not found");
    return notFound();
  }

  logger.debug(
    {
      giftCardId: params.id,
      giftCardCode: giftCard.code,
      giftCardAmount: giftCard.amount,
      giftCardExpiresAt: giftCard.expiresAt,
      giftCardStatus: giftCard.status,
      giftCardPaymentId: giftCard.paymentId,
    },
    "Service gift card edit page loaded",
  );

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.giftCards"),
      link: "/dashboard/services/gift-cards",
    },
    {
      title: giftCard.code,
      link: `/dashboard/services/gift-cards/${params.id}`,
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={giftCard.code}
            description={t("services.giftCards.editDescription")}
          />
        </div>
        <GiftCardForm initialData={giftCard} />
      </div>
    </PageContainer>
  );
}
