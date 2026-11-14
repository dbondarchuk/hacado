import PageContainer from "@/components/admin/layout/page-container";
import { SyncedPaymentsReview } from "@/components/admin/synced-payments/review";
import { getI18nAsync } from "@hacado/i18n/server";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("paymentsInbox.title"),
  };
}

export default async function PaymentsInboxPage() {
  const t = await getI18nAsync("admin");

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.financials"), link: "/dashboard/financials" },
    {
      title: t("navigation.paymentsInbox"),
      mobileTitle: t("paymentsInbox.title"),
      link: "/dashboard/financials/inbox",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <PageHeader text={t("paymentsInbox.description")} />
        <SyncedPaymentsReview />
      </div>
    </PageContainer>
  );
}
