import {
  type LayoutTemplateContext,
  type LayoutTemplateDefinition,
  type TemplatesConfiguration,
} from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";
import { LayoutTemplate } from "lucide-react";
import { layoutTemplatePreviewPath } from "../preview-manifest";
import { WEBSITE_PACK_IDS, WEBSITE_PACKS } from "./registry";
import {
  composeAbout,
  composeBooking,
  composeHome,
  composeService,
  composeTerms,
} from "./sections";
import type {
  PageLayoutKind,
  WebsitePackDefinition,
  WebsitePackId,
} from "./types";

export * from "./media";
export * from "./registry";
export {
  composeAbout,
  composeBooking,
  composeHome,
  composeService,
  composeTerms,
  resolveServices,
} from "./sections";
export * from "./types";

const LAYOUT_KINDS: PageLayoutKind[] = [
  "home",
  "booking",
  "service",
  "about",
  "terms",
];

function composeForKind(
  pack: WebsitePackDefinition,
  layoutKind: PageLayoutKind,
  t: I18nFn<undefined, undefined>,
  ctx?: LayoutTemplateContext,
) {
  switch (layoutKind) {
    case "home":
      return composeHome(pack, t, ctx);
    case "booking":
      return composeBooking(pack, t, ctx);
    case "service":
      return composeService(pack, t, ctx);
    case "about":
      return composeAbout(pack, t, ctx);
    case "terms":
      return composeTerms(pack, t, ctx);
  }
}

function layoutTemplateKey(packId: WebsitePackId, layoutKind: PageLayoutKind) {
  return `Layout_${packId}_${layoutKind}`;
}

function buildLayoutTemplate(
  pack: WebsitePackDefinition,
  layoutKind: PageLayoutKind,
): LayoutTemplateDefinition {
  return {
    kind: "layout",
    layoutKind,
    packId: pack.id,
    allowedBuilderTypes: ["page"],
    displayName:
      `builder.pageBuilder.pageTemplates.layouts.${pack.id}.${layoutKind}` as BaseAllKeys,
    category: pack.category,
    icon: <LayoutTemplate />,
    previewImage: layoutTemplatePreviewPath(`${pack.id}-${layoutKind}.png`),
    getBlocks: (t, ctx) => composeForKind(pack, layoutKind, t, ctx),
  };
}

export const layoutEditorTemplates: TemplatesConfiguration = Object.fromEntries(
  WEBSITE_PACK_IDS.flatMap((packId) => {
    const pack = WEBSITE_PACKS[packId];
    return LAYOUT_KINDS.map((layoutKind) => [
      layoutTemplateKey(packId, layoutKind),
      buildLayoutTemplate(pack, layoutKind),
    ]);
  }),
);

export function getLayoutTemplateKey(
  packId: WebsitePackId,
  layoutKind: PageLayoutKind,
) {
  return layoutTemplateKey(packId, layoutKind);
}

export function getPackLayoutBlocks(
  packId: WebsitePackId,
  layoutKind: PageLayoutKind,
  t: I18nFn<undefined, undefined>,
  ctx?: LayoutTemplateContext,
) {
  return composeForKind(WEBSITE_PACKS[packId], layoutKind, t, ctx);
}
