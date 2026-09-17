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
  | "professional"
  | "salon_b"
  | "tattoo_b"
  | "spa_b"
  | "coach_b"
  | "fitness_b"
  | "photography_b"
  | "clinic_b"
  | "pet_b"
  | "home_services_b"
  | "professional_b"
  | "salon_c"
  | "tattoo_c"
  | "spa_c"
  | "coach_c"
  | "fitness_c"
  | "photography_c"
  | "clinic_c"
  | "pet_c"
  | "home_services_c"
  | "professional_c";

/** Page-builder layout roles (opaque `layoutKind` string on base builder). */
export type PageLayoutKind = "home" | "booking" | "service" | "about" | "terms";

export type PackHeroKind =
  | "split"
  | "centered"
  | "overlay"
  | "minimal"
  | "leftOverlay"
  | "galleryFirst"
  | "announcementSplit"
  | "video";

export type PackHomeSection =
  | "zigzag"
  | "bento"
  | "featureList"
  | "gallery"
  | "galleryCarousel"
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
  | "video"
  | "cta";

export type PackServiceExtra =
  | "beforeAfter"
  | "gallery"
  | "galleryCarousel"
  | "video";

/** Visual rhythm for alternating section bands + hero intensity. */
export type PackMood = "light" | "muted" | "dark" | "bold";

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
  /** Optional banded backgrounds + motion intensity for Series C+. */
  mood?: PackMood;
  /** Staggered entrance animations on home sections (default true for mood packs). */
  motion?: boolean;
};

export type LayoutComposer = (
  t: I18nFn<undefined, undefined>,
  ctx?: LayoutTemplateContext,
) => TEditorBlock[];

export type WebsitePackLayouts = Record<PageLayoutKind, LayoutComposer>;

export type ResolvedLayoutService = LayoutTemplateService & {
  keywords?: string[];
};
