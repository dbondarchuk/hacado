import { renderCatalogPackSitePage } from "@/template-previews/render-catalog-pack-site";
import { isCatalogSeries } from "@hacado/page-builder/templates";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ series: string; pack: string; slug?: string[] }>;
};

export default async function FullCatalogPackSitePage(props: Props) {
  const { series, pack, slug } = await props.params;
  if (!isCatalogSeries(series)) notFound();

  return renderCatalogPackSitePage({
    series,
    packSlug: pack,
    slug,
  });
}
