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
  getLayoutTemplateKey,
  getPackLayoutBlocks,
  getWebsitePack,
  layoutEditorTemplates,
  matchServiceImage,
  suggestWebsitePackId,
  WEBSITE_PACK_IDS,
  WEBSITE_PACKS,
  type PageLayoutKind,
  type WebsitePackId,
} from "./layouts";
export { marketingEditorTemplates } from "./marketing";
export { mediaEditorTemplates } from "./media";
export {
  getTemplatePreviewDelayMs,
  HERO_TEMPLATE_PREVIEWS,
  heroTemplatePreviewPath,
  LAYOUT_TEMPLATE_PREVIEWS,
  layoutTemplatePreviewPath,
  MARKETING_TEMPLATE_PREVIEWS,
  marketingTemplatePreviewPath,
  SECTION_TEMPLATE_PREVIEW_BASE,
  SECTION_TEMPLATE_PREVIEWS,
  sectionTemplatePreviewPath,
  TEMPLATE_PREVIEW_BASE,
  TEMPLATE_PREVIEWS,
  templatePreviewPath,
  type SectionTemplatePreviewKey,
  type TemplatePreviewGroup,
  type TemplatePreviewKey,
} from "./preview-manifest";
export { socialProofEditorTemplates } from "./social-proof";
