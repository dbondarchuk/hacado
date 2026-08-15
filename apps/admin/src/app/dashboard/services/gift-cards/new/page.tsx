import PageContainer from "@/components/admin/layout/page-container";
import { GiftCardForm } from "@/components/admin/services/gift-cards/form";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { Metadata } from "next/types";

type Props = PageProps<"/dashboard/services/gift-cards/new">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.giftCards.new"),
  };
}

export default async function NewGiftCardPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("new-service-gift-card");
  const t = await getI18nAsync("admin");
  const { from: fromParam } = await props.searchParams;
  const from = fromParam as string;

  logger.debug(
    {
      fromDiscountId: from,
    },
    "Loading new service gift card page",
  );

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.giftCards"),
      link: "/dashboard/services/gift-cards",
    },
    {
      title: t("services.giftCards.new"),
      link: "/dashboard/services/gift-cards/new",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("services.giftCards.newTitle")}
            description={t("services.giftCards.newDescription")}
          />
        </div>
        <GiftCardForm />
      </div>
    </PageContainer>
  );
}
