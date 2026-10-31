import PageContainer from "@/components/admin/layout/page-container";
import { OpenPaymentDetailsFromQuery } from "@/components/admin/payments/table/open-payment-details-from-query";
import { PaymentsTable } from "@/components/admin/payments/table/table";
import { PaymentsTableAction } from "@/components/admin/payments/table/table-action";
import {
  paymentsSearchParamsCache,
  paymentsSearchParamsSerializer,
} from "@hacado/api-sdk/admin/search-params/payments";
import { getI18nAsync } from "@hacado/i18n/server";
import { DataTableSkeleton } from "@hacado/ui-admin/data-table";
import {
  HeaderActionButtonsContainer,
  HeaderActionButtonsProvider,
} from "@hacado/ui-admin-kit/page";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Heading } from "@hacado/ui/heading";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/financials/payments">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("paymentsList.title"),
  };
}

export default async function PaymentsPage(props: Params) {
  const t = await getI18nAsync("admin");
  const searchParams = await props.searchParams;
  const parsed = paymentsSearchParamsCache.parse(searchParams);
  const key = paymentsSearchParamsSerializer({ ...parsed });

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.financials"),
      link: "/dashboard/financials",
    },
    {
      title: t("navigation.payments"),
      link: "/dashboard/financials/payments",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <HeaderActionButtonsProvider>
        <div className="flex flex-1 flex-col gap-4 w-full">
          <div className="flex flex-col gap-4">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Heading
                title={t("paymentsList.title")}
                description={t("paymentsList.description")}
                className="min-w-0"
              />
              <HeaderActionButtonsContainer className="w-full flex-wrap justify-end md:w-auto" />
            </div>
          </div>
          <PaymentsTableAction showAddPayment />
          <Suspense
            key={key}
            fallback={<DataTableSkeleton columnCount={8} rowCount={10} />}
          >
            <PaymentsTable />
          </Suspense>
          <Suspense fallback={null}>
            <OpenPaymentDetailsFromQuery />
          </Suspense>
        </div>
      </HeaderActionButtonsProvider>
    </PageContainer>
  );
}
