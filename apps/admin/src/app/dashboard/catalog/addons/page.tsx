import { getUser } from "@/app/utils";
import { AddonsTable } from "@/components/admin/catalog/addons/table/table";
import { AddonsTableAction } from "@/components/admin/catalog/addons/table/table-action";
import PageContainer from "@/components/admin/layout/page-container";
import {
  addonsSearchParamsCache,
  addonsSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading, Link } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { hasPermission } from "@hacado/utils";
import { Plus } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/catalog/addons">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.addons.title"),
  };
}

export default async function AddonsPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("addons");
  const t = await getI18nAsync("admin");

  logger.debug("Loading addons page");
  const searchParams = await props.searchParams;
  const parsed = addonsSearchParamsCache.parse(searchParams);
  const key = addonsSearchParamsSerializer({ ...parsed });
  const user = await getUser();
  const canCreate = hasPermission(user, "service", "create");

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.catalog"), link: "/dashboard/catalog" },
    { title: t("navigation.addons"), link: "/dashboard/catalog/addons" },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("catalog.addons.title")}
              description={t("catalog.addons.description")}
            />

            {canCreate ? (
              <Link
                button
                href={"/dashboard/catalog/addons/new"}
                variant="default"
              >
                <Plus /> {t("catalog.addons.addNew")}
              </Link>
            ) : null}
          </div>
        </div>
        <AddonsTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={5} rowCount={10} />}
        >
          <AddonsTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
