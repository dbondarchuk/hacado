import { getUser } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { AddonsTable } from "@/components/admin/services/addons/table/table";
import { AddonsTableAction } from "@/components/admin/services/addons/table/table-action";
import {
  serviceAddonsSearchParamsCache,
  serviceAddonsSearchParamsSerializer,
} from "@timelish/api-sdk";
import { getI18nAsync } from "@timelish/i18n/server";
import { getLoggerFactory } from "@timelish/logger";
import { Breadcrumbs, Heading, Link } from "@timelish/ui";
import { DataTableSkeleton } from "@timelish/ui-admin";
import { hasPermission } from "@timelish/utils";
import { Plus } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/services/addons">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.addons.title"),
  };
}

export default async function AddonsPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("addons");
  const t = await getI18nAsync("admin");

  logger.debug("Loading addons page");
  const searchParams = await props.searchParams;
  const parsed = serviceAddonsSearchParamsCache.parse(searchParams);
  const key = serviceAddonsSearchParamsSerializer({ ...parsed });
  const user = await getUser();
  const canCreate = hasPermission(user, "service", "create");

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    { title: t("navigation.addons"), link: "/dashboard/services/addons" },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("services.addons.title")}
              description={t("services.addons.description")}
            />

            {canCreate ? (
              <Link
                button
                href={"/dashboard/services/addons/new"}
                variant="default"
              >
                <Plus /> {t("services.addons.addNew")}
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
