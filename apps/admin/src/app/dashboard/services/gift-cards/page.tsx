import PageContainer from "@/components/admin/layout/page-container";
import { GiftCardsTable } from "@/components/admin/services/gift-cards/table/table";
import { GiftCardsTableAction } from "@/components/admin/services/gift-cards/table/table-action";
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

type Params = PageProps<"/dashboard/services/gift-cards">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.giftCards.title"),
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
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.giftCards"),
      link: "/dashboard/services/gift-cards",
    },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("services.giftCards.title")}
              description={t("services.giftCards.description")}
            />

            <Link
              button
              href={"/dashboard/services/gift-cards/new"}
              variant="default"
            >
              <Plus /> {t("services.giftCards.addNew")}
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
      </div>
    </PageContainer>
  );
}
