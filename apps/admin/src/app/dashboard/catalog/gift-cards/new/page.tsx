import { GiftCardForm } from "@/components/admin/catalog/gift-cards/form";
import PageContainer from "@/components/admin/layout/page-container";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
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
      mobileTitle: t("catalog.giftCards.newTitle"),
      link: "/dashboard/catalog/gift-cards/new",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <PageHeader text={t("catalog.giftCards.newDescription")} />
        <GiftCardForm />
      </div>
    </PageContainer>
  );
}
