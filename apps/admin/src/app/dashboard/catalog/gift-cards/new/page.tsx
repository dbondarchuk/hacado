import { GiftCardForm } from "@/components/admin/catalog/gift-cards/form";
import PageContainer from "@/components/admin/layout/page-container";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { Metadata } from "next/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.giftCards.new"),
  };
}

export default async function NewGiftCardPage() {
  const t = await getI18nAsync("admin");
  await assertPageHasPermission("giftCard", "create");

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.catalog"), link: "/dashboard/catalog" },
    {
      title: t("navigation.giftCards"),
      link: "/dashboard/catalog/gift-cards",
    },
    {
      title: t("catalog.giftCards.new"),
      link: "/dashboard/catalog/gift-cards/new",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("catalog.giftCards.newTitle")}
            description={t("catalog.giftCards.newDescription")}
          />
        </div>
        <GiftCardForm />
      </div>
    </PageContainer>
  );
}
