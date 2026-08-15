import { AssetForm } from "@/components/admin/assets/form";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("assets.new"),
  };
}

export default async function NewAssetsPage() {
  const logger = getLoggerFactory("AdminPages")("new-asset");
  const t = await getI18nAsync("admin");

  logger.debug("Loading new asset page");

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    { title: t("assets.title"), link: "/dashboard/assets" },
    { title: t("assets.newPage"), link: "/dashboard/assets/new" },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("assets.new")}
            description={t("assets.uploadNewAssets")}
          />
          {/* <Separator /> */}
        </div>
        <AssetForm />
      </div>
    </PageContainer>
  );
}
