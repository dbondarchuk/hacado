import { getUser } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { FieldsTable } from "@/components/admin/services/fields/table/table";
import { FieldsTableAction } from "@/components/admin/services/fields/table/table-action";
import {
  serviceFieldsSearchParamsCache,
  serviceFieldsSearchParamsSerializer,
} from "@hacado/api-sdk";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading, Link } from "@hacado/ui";
import { DataTableSkeleton } from "@hacado/ui-admin";
import { hasPermission } from "@hacado/utils";
import { Plus } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";

type Params = PageProps<"/dashboard/services/fields">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.fields.title"),
  };
}

export default async function FieldsPage(props: Params) {
  const logger = getLoggerFactory("AdminPages")("fields");
  const t = await getI18nAsync("admin");

  logger.debug("Loading fields page");
  const searchParams = await props.searchParams;
  const parsed = serviceFieldsSearchParamsCache.parse(searchParams);

  const key = serviceFieldsSearchParamsSerializer({ ...parsed });
  const user = await getUser();
  const canCreate = hasPermission(user, "service", "create");

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    { title: t("navigation.fields"), link: "/dashboard/services/fields" },
  ];

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <Heading
              title={t("services.fields.title")}
              description={t("services.fields.description")}
            />

            {canCreate ? (
              <Link
                button
                href={"/dashboard/services/fields/new"}
                variant="default"
              >
                <Plus /> {t("services.fields.addNew")}
              </Link>
            ) : null}
          </div>
        </div>
        <FieldsTableAction />
        <Suspense
          key={key}
          fallback={<DataTableSkeleton columnCount={8} rowCount={10} />}
        >
          <FieldsTable />
        </Suspense>
      </div>
    </PageContainer>
  );
}
