import { CatalogSiteClient } from "@/template-previews/catalog-site-client";
import { getTemplatePreviewDelayMs } from "@/template-previews/preview-config";
import type { LayoutTemplateService } from "@hacado/builder";
import { getI18nAsync } from "@hacado/i18n/server";
import {
  catalogPackBasePath,
  catalogPartsToPackId,
  getLayoutTemplateKey,
  getPackLayoutBlocks,
  getWebsitePack,
  layoutPreviewHeaderVariant,
  matchServiceImage,
  parseCatalogSlug,
  type CatalogSeries,
  type PageLayoutKind,
} from "@hacado/page-builder/templates";
import { notFound } from "next/navigation";

type Props = {
  series: CatalogSeries;
  packSlug: string;
  slug?: string[];
};

export async function renderCatalogPackSitePage({
  series,
  packSlug,
  slug,
}: Props) {
  const packId = catalogPartsToPackId(series, packSlug);
  if (!packId) notFound();

  const route = parseCatalogSlug(slug);
  if (!route) notFound();

  const t = await getI18nAsync({ locale: "en" });
  const pack = getWebsitePack(packId);
  const basePath = catalogPackBasePath(packId);
  const layoutKind: PageLayoutKind = route.layoutKind;

  const services: LayoutTemplateService[] = pack.demoServices.map((demo) => {
    const name = t(demo.nameKey);
    return {
      id: demo.id,
      name,
      description: t(demo.descriptionKey),
      slug: demo.slug,
      pageSlug: `service/${demo.slug}`,
      imageUrl: matchServiceImage(packId, name),
    };
  });

  const selectedService =
    route.layoutKind === "service"
      ? services.find((service) => service.slug === route.serviceSlug) ||
        services[0]
      : undefined;

  if (route.layoutKind === "service" && !selectedService) {
    notFound();
  }

  const children = getPackLayoutBlocks(
    packId,
    layoutKind,
    t,
    { services },
    selectedService,
  );

  const header = layoutPreviewHeaderVariant(packId, layoutKind);
  const templateKey = getLayoutTemplateKey(packId, layoutKind);
  const previewDelayMs = getTemplatePreviewDelayMs(templateKey);

  return (
    <CatalogSiteClient
      packId={packId}
      basePath={basePath}
      header={header}
      childrenBlocks={children}
      previewDelayMs={previewDelayMs}
    />
  );
}
