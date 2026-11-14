import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import {
  HeaderActionButtonsContainer,
  HeaderActionButtonsProvider,
} from "@hacado/ui-admin-kit/page";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
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
      mobileTitle: t("financialOverview.view.title"),
      link: "/dashboard/financials/overview",
    },
  ];

  return (
    <PageContainer scrollable>
      <HeaderActionButtonsProvider>
        <div className="flex w-full flex-1 flex-col gap-4">
          <Breadcrumbs items={breadcrumbItems} />
          <PageHeader
            text={t("financialOverview.description")}
            actions={
              <HeaderActionButtonsContainer className="justify-end py-2" />
            }
          />
          <FinancialsOverviewLoader searchParams={searchParams} />
        </div>
      </HeaderActionButtonsProvider>
    </PageContainer>
  );
}
