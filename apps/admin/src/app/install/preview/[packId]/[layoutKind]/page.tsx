import { InstallLayoutPreviewClient } from "@/app/install/preview/[packId]/[layoutKind]/install-layout-preview-client";
import { getSession } from "@/app/utils";
import type { LayoutTemplateService } from "@hacado/builder";
import { languages, type Language } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import {
  getPackLayoutBlocks,
  getWebsitePack,
  packUsesOverlayHeader,
  WEBSITE_PACK_IDS,
  type PageLayoutKind,
  type WebsitePackId,
} from "@hacado/page-builder/templates";
import { deserializeMarkdown } from "@hacado/rte";
import { ServicesContainer } from "@hacado/services";
import { flattenCatalogOptionIds } from "@hacado/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const LAYOUT_KINDS: PageLayoutKind[] = [
  "home",
  "booking",
  "service",
  "about",
  "terms",
];

function isWebsitePackId(value: string): value is WebsitePackId {
  return (WEBSITE_PACK_IDS as string[]).includes(value);
}

function isPageLayoutKind(value: string): value is PageLayoutKind {
  return (LAYOUT_KINDS as string[]).includes(value);
}

function plateToPlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  const parts: string[] = [];
  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== "object") continue;
      const record = node as Record<string, unknown>;
      if (typeof record.text === "string") parts.push(record.text);
      if (Array.isArray(record.children)) walk(record.children);
    }
  };
  walk(value);
  return parts.join("").trim();
}

async function loadLayoutServices(
  organizationId: string,
): Promise<LayoutTemplateService[]> {
  const services = ServicesContainer(organizationId, true);
  const booking =
    (await services.configurationService.getConfiguration("booking")) ?? null;
  const optionIds = flattenCatalogOptionIds(booking?.catalog);
  const output: LayoutTemplateService[] = [];

  for (const optionId of optionIds) {
    const option = await services.servicesService.getOption(optionId);
    if (!option) continue;
    const descriptionMarkdown =
      typeof option.description === "string" ? option.description : "";
    const descriptionPlate = deserializeMarkdown(descriptionMarkdown);
    const name = String(option.name ?? "").trim() || "Service";
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    output.push({
      id: optionId,
      name,
      description: plateToPlainText(descriptionPlate) || name,
      slug,
      pageSlug: `service/${slug}`,
    });
  }

  return output;
}

type Props = {
  params: Promise<{ packId: string; layoutKind: string }>;
};

export default async function InstallLayoutPreviewPage(props: Props) {
  const { packId: packIdRaw, layoutKind: layoutKindRaw } = await props.params;
  if (!isWebsitePackId(packIdRaw) || !isPageLayoutKind(layoutKindRaw)) {
    notFound();
  }

  const packId = packIdRaw;
  const layoutKind = layoutKindRaw;
  const session = await getSession();
  const organizationId = session.user.organizationId;
  if (!organizationId) {
    notFound();
  }

  const services = ServicesContainer(organizationId, true);
  const [styling, general, brand, layoutServices] = await Promise.all([
    services.configurationService.getConfiguration("styling"),
    services.configurationService.getConfiguration("general"),
    services.configurationService.getConfiguration("brand"),
    loadLayoutServices(organizationId),
  ]);

  const languageCandidate =
    brand?.language ??
    (typeof (general as Record<string, unknown> | null)?.language === "string"
      ? ((general as Record<string, unknown>).language as string)
      : "en");
  const language = (
    languages.includes(languageCandidate as Language) ? languageCandidate : "en"
  ) as Language;

  const t = await getI18nAsync({ locale: language });
  const pack = getWebsitePack(packId);
  const children = getPackLayoutBlocks(packId, layoutKind, t, {
    services: layoutServices,
  });

  const businessName =
    (typeof general?.name === "string" && general.name.trim()) ||
    (typeof brand?.title === "string" && brand.title.trim()) ||
    "Studio";
  const logoUrl =
    typeof brand?.logo === "string"
      ? brand.logo
      : typeof (general as Record<string, unknown> | null)?.logo === "string"
        ? ((general as Record<string, unknown>).logo as string)
        : null;

  const header =
    layoutKind === "home" && packUsesOverlayHeader(pack.hero)
      ? ("transparent" as const)
      : ("solid" as const);

  return (
    <InstallLayoutPreviewClient
      childrenBlocks={children}
      styling={styling}
      header={header}
      footer
      logoUrl={logoUrl}
      businessName={businessName}
    />
  );
}
