import type {
  LayoutTemplateContext,
  LayoutTemplateService,
  TEditorBlock,
} from "@hacado/builder";
import type { BaseAllKeys, I18nFn } from "@hacado/i18n";

export type WebsitePackId =
  | "salon"
  | "tattoo"
  | "spa"
  | "coach"
  | "fitness"
  | "photography"
  | "clinic"
  | "pet"
  | "home_services"
  | "professional";

/** Page-builder layout roles (opaque `layoutKind` string on base builder). */
export type PageLayoutKind = "home" | "booking" | "service" | "about" | "terms";

export type PackHeroKind =
  | "split"
  | "centered"
  | "overlay"
  | "minimal"
  | "leftOverlay"
  | "galleryFirst"
  | "announcementSplit";

export type PackHomeSection =
  | "zigzag"
  | "bento"
  | "featureList"
  | "gallery"
  | "carousel"
  | "beforeAfter"
  | "testimonials"
  | "stats"
  | "logoMarquee"
  | "logoCloud"
  | "howItWorks"
  | "faq"
  | "faqTeaser"
  | "pricing"
  | "comparison"
  | "featuresShowcase"
  | "cta";

export type PackServiceExtra = "beforeAfter" | "gallery" | "video";

export type PackMediaItem = {
  src: string;
  keywords: string[];
};

export type PackMediaLibrary = {
  generic: string;
  items: PackMediaItem[];
  before?: string;
  after?: string;
  logos?: Array<{ src: string; name: string }>;
};

export type PackDemoServiceDef = {
  id: string;
  nameKey: BaseAllKeys;
  descriptionKey: BaseAllKeys;
  slug: string;
  keywords: string[];
};

export type WebsitePackDefinition = {
  id: WebsitePackId;
  /** Install catalog categories that suggest this pack. */
  installCategories: string[];
  displayName: BaseAllKeys;
  category: BaseAllKeys;
  hero: PackHeroKind;
  homeMix: PackHomeSection[];
  serviceExtra: PackServiceExtra;
  media: PackMediaLibrary;
  demoServices: PackDemoServiceDef[];
};

export type LayoutComposer = (
  t: I18nFn<undefined, undefined>,
  ctx?: LayoutTemplateContext,
) => TEditorBlock[];

export type WebsitePackLayouts = Record<PageLayoutKind, LayoutComposer>;

export type ResolvedLayoutService = LayoutTemplateService & {
  keywords?: string[];
};
