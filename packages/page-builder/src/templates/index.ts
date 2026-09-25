import { bookingSectionEditorTemplates } from "./booking-sections";
import { contentEditorTemplates } from "./content";
import { conversionEditorTemplates } from "./conversion";
import { featuresEditorTemplates } from "./features";
import { heroEditorTemplates } from "./heroes";
import { layoutEditorTemplates } from "./layouts";
import { marketingEditorTemplates } from "./marketing";
import { mediaEditorTemplates } from "./media";
import { socialProofEditorTemplates } from "./social-proof";

export const pageBuilderEditorTemplates = {
  ...marketingEditorTemplates,
  ...heroEditorTemplates,
  ...socialProofEditorTemplates,
  ...featuresEditorTemplates,
  ...conversionEditorTemplates,
  ...contentEditorTemplates,
  ...mediaEditorTemplates,
  ...bookingSectionEditorTemplates,
  ...layoutEditorTemplates,
};

export { bookingSectionEditorTemplates } from "./booking-sections";
export { contentEditorTemplates } from "./content";
export { conversionEditorTemplates } from "./conversion";
export { featuresEditorTemplates } from "./features";
export { heroEditorTemplates } from "./heroes";
export {
  CATALOG_INDEX_PATH,
  CATALOG_SERIES,
  CATALOG_SITE_PREFIX,
  CATALOG_URL_PREFIX,
  catalogPackBasePath,
  catalogPagePath,
  catalogPartsToPackId,
  catalogSlugToPackId,
  composeService,
  getLayoutTemplateKey,
  getPackLayoutBlocks,
  getPackSuggestedStyling,
  getWebsitePack,
  isCatalogInternalPath,
  isCatalogSeries,
  layoutEditorTemplates,
  matchServiceImage,
  mergePackStylingBase,
  PACK_THEMES,
  packIdFromLayoutTemplateKey,
  packIdToCatalogParts,
  packIdToCatalogSlug,
  packThemeToStyling,
  parseCatalogSlug,
  rewriteCatalogInternalPath,
  rewriteCatalogUrlsInTree,
  suggestWebsitePackId,
  WEBSITE_PACK_IDS,
  WEBSITE_PACKS,
  type CatalogRoute,
  type CatalogSeries,
  type PackTheme,
  type PageLayoutKind,
  type WebsitePackId,
} from "./layouts";
export { marketingEditorTemplates } from "./marketing";
export { mediaEditorTemplates } from "./media";
export {
  getTemplatePreviewChrome,
  getTemplatePreviewDelayMs,
  HERO_TEMPLATE_PREVIEWS,
  heroTemplatePreviewPath,
  LAYOUT_FULL_PAGE_PREVIEWS,
  LAYOUT_TEMPLATE_PREVIEWS,
  layoutFullPagePreviewPath,
  layoutPreviewHeaderVariant,
  layoutTemplatePreviewPath,
  MARKETING_TEMPLATE_PREVIEWS,
  marketingTemplatePreviewPath,
  packUsesOverlayHeader,
  SECTION_TEMPLATE_PREVIEW_BASE,
  SECTION_TEMPLATE_PREVIEWS,
  sectionTemplatePreviewPath,
  TEMPLATE_PREVIEW_BASE,
  TEMPLATE_PREVIEWS,
  templatePreviewPath,
  type SectionTemplatePreviewKey,
  type TemplatePreviewChrome,
  type TemplatePreviewGroup,
  type TemplatePreviewKey,
} from "./preview-manifest";
export { socialProofEditorTemplates } from "./social-proof";
