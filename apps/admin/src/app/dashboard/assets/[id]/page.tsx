import { getServicesContainer } from "@/app/utils";
import { AssetEditForm } from "@/components/admin/assets/edit-form";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

type Props = PageProps<"/dashboard/assets/[id]">;

const getAsset = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.assetsService.getAsset(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const asset = await getAsset(id);
  return {
    title: t("assets.edit"),
    description: asset?.filename,
  };
}

export default async function EditAssetsPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("edit-asset");
  const t = await getI18nAsync("admin");
  const params = await props.params;

  logger.debug(
    {
      assetId: params.id,
    },
    "Loading asset edit page",
  );

  const asset = await getAsset(params.id);

  if (!asset) {
    logger.warn({ assetId: params.id }, "Asset not found");
    return notFound();
  }

  logger.debug(
    {
      assetId: params.id,
      filename: asset.filename,
      mimeType: asset.mimeType,
    },
    "Asset edit page loaded",
  );

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    { title: t("assets.title"), link: "/dashboard/assets" },
    { title: t("assets.editPage"), link: "/dashboard/assets" },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading title={t("assets.edit")} description={asset.filename} />
          {/* <Separator /> */}
        </div>
        <AssetEditForm asset={asset} />
      </div>
    </PageContainer>
  );
}
