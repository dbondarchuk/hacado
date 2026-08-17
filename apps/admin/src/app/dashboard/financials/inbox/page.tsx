import PageContainer from "@/components/admin/layout/page-container";
import { SyncedPaymentsReview } from "@/components/admin/synced-payments/review";
import { getI18nAsync } from "@hacado/i18n/server";
import { Breadcrumbs, Heading } from "@hacado/ui";
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
      link: "/dashboard/financials/inbox",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("paymentsInbox.title")}
            description={t("paymentsInbox.description")}
          />
        </div>
        <SyncedPaymentsReview />
      </div>
    </PageContainer>
  );
}
