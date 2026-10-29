import { GiftCardsTable } from "@/components/admin/catalog/gift-cards/table/table";
import { GiftCardsTableAction } from "@/components/admin/catalog/gift-cards/table/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import { OpenPaymentDetailsFromQuery } from "@/components/admin/payments/table/open-payment-details-from-query";
import {
  giftCardsSearchParamsCache,
  giftCardsSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading, Link } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { Plus } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/catalog/gift-cards">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.giftCards.title"),
  };
}

export default async function GiftCardsPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("giftCards");
  const t = await getI18nAsync("admin");

  logger.debug("Loading gift cards page");
  const searchParams = await props.searchParams;
  const parsed = giftCardsSearchParamsCache.parse(searchParams);
  const key = giftCardsSearchParamsSerializer({ ...parsed });

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.catalog"), link: "/dashboard/catalog" },
    {
      title: t("navigation.giftCards"),
      link: "/dashboard/catalog/gift-cards",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("catalog.giftCards.title")}
              description={t("catalog.giftCards.description")}
            />

            <Link
              button
              href={"/dashboard/catalog/gift-cards/new"}
              variant="default"
            >
              <Plus /> {t("catalog.giftCards.addNew")}
            </Link>
          </div>
          {/* <Separator /> */}
        </div>
        <GiftCardsTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={11} rowCount={10} />}
        >
          <GiftCardsTable />
        </Suspense>
        <Suspense fallback={null}>
          <OpenPaymentDetailsFromQuery />
        </Suspense>
      </div>
    </PageContainer>
  );
}
