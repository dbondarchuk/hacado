import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import {
  HeaderActionButtonsContainer,
  HeaderActionButtonsProvider,
} from "@hacado/ui-admin-kit/page";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Heading } from "@hacado/ui/heading";
import { Metadata } from "next";
import { FinancialsOverviewLoader } from "./loader";

type Params = PageProps<"/dashboard/financials/overview">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("financialOverview.view.title"),
  };
}

export default async function FinancialOverviewPage(props: Params) {
  const t = await getI18nAsync("admin");
  const searchParams = await props.searchParams;

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.financials"),
      link: "/dashboard/financials",
    },
    {
      title: t("navigation.financialOverview"),
      link: "/dashboard/financials/overview",
    },
  ];

  return (
    <PageContainer scrollable>
      <HeaderActionButtonsProvider>
        <div className="flex flex-1 flex-col gap-4 w-full">
          <div className="flex flex-col gap-4">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Heading
                title={t("financialOverview.view.title")}
                description={t("financialOverview.description")}
                className="min-w-0"
              />
              <HeaderActionButtonsContainer className="w-full flex-wrap justify-end md:w-auto" />
            </div>
          </div>
          <FinancialsOverviewLoader searchParams={searchParams} />
        </div>
      </HeaderActionButtonsProvider>
    </PageContainer>
  );
}
