import PageContainer from "@/components/admin/layout/page-container";
import { PageFootersTable } from "@/components/admin/pages/footers/table/table";
import { PageFootersTableAction } from "@/components/admin/pages/footers/table/table-action";
import {
  pageFootersSearchParamsCache,
  pageFootersSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading, Link } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { Plus } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/pages/footers">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("pages.footers.title"),
  };
}

export default async function PageFootersPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("footers");
  const t = await getI18nAsync("admin");

  logger.debug("Loading page footers page");
  const searchParams = await props.searchParams;
  const parsed = pageFootersSearchParamsCache.parse(searchParams);

  const key = pageFootersSearchParamsSerializer({ ...parsed });

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    { title: t("pages.title"), link: "/dashboard/pages" },
    { title: t("pages.footers.title"), link: "/dashboard/pages/footers" },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("pages.footers.title")}
              description={t("pages.footers.managePageFooters")}
            />

            <Link
              button
              href={"/dashboard/pages/footers/new"}
              variant="default"
            >
              <Plus /> {t("pages.footers.addNew")}
            </Link>
          </div>
        </div>
        <PageFootersTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={5} rowCount={10} />}
        >
          <PageFootersTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
