import { WEBSITE_PACKS } from "./layouts/registry";
import type { PackHeroKind } from "./layouts/types";

export type TemplatePreviewGroup =
  | "marketing"
  | "heroes"
  | "sections"
  | "layouts"
  | "layouts-full";

export type TemplatePreviewChrome = {
  supported: true;
  header: "solid" | "transparent";
  footer?: boolean;
};

export type TemplatePreviewEntry = {
  key: string;
  group: TemplatePreviewGroup;
  file: string;
  /** Extra wait before screenshot (booking widgets, etc.). */
  delayMs?: number;
  /** Full-page chrome for install thumbnails (`--full-page-layouts`). */
  chrome?: TemplatePreviewChrome;
};

export const TEMPLATE_PREVIEW_BASE = "/pages/templates";

export const MARKETING_TEMPLATE_PREVIEWS = [
  { key: "SectionIntro", group: "marketing", file: "section-intro.png" },
  { key: "StatCell", group: "marketing", file: "stat-cell.png" },
  { key: "Step", group: "marketing", file: "step.png" },
  { key: "TestimonialCard", group: "marketing", file: "testimonial-card.png" },
  { key: "CtaBand", group: "marketing", file: "cta-band.png" },
  { key: "PlanCard", group: "marketing", file: "plan-card.png" },
  { key: "Badge", group: "marketing", file: "badge.png" },
  { key: "Banner", group: "marketing", file: "banner.png" },
  { key: "LogoCard", group: "marketing", file: "logo-card.png" },
] as const satisfies readonly TemplatePreviewEntry[];

export const HERO_TEMPLATE_PREVIEWS = [
  { key: "HeroCenteredImage", group: "heroes", file: "centered-image.png" },
  { key: "HeroSplitImage", group: "heroes", file: "split-image.png" },
  {
    key: "HeroVideoBackground",
    group: "heroes",
    file: "video-background.png",
    delayMs: 5000,
  },
  { key: "HeroMinimal", group: "heroes", file: "minimal.png" },
  { key: "HeroLeftOverlay", group: "heroes", file: "left-overlay.png" },
] as const satisfies readonly TemplatePreviewEntry[];

export const SECTION_TEMPLATE_PREVIEWS = [
  { key: "LogoMarqueeSection", group: "sections", file: "logo-marquee.png" },
  { key: "StatsRowSection", group: "sections", file: "stats-row.png" },
  {
    key: "TestimonialsGrid",
    group: "sections",
    file: "testimonials-grid.png",
  },
  { key: "LogoCloudGrid", group: "sections", file: "logo-cloud-grid.png" },
  {
    key: "FeaturesShowcaseSection",
    group: "sections",
    file: "features-showcase.png",
  },
  { key: "FeaturesBento", group: "sections", file: "features-bento.png" },
  { key: "ZigzagFeature", group: "sections", file: "zigzag-feature.png" },
  {
    key: "FeatureListWithImage",
    group: "sections",
    file: "feature-list-with-image.png",
  },
  {
    key: "PricingThreeColumn",
    group: "sections",
    file: "pricing-three-column.png",
  },
  { key: "CtaBandSection", group: "sections", file: "cta-band-section.png" },
  {
    key: "AnnouncementBar",
    group: "sections",
    file: "announcement-bar.png",
  },
  {
    key: "CookieAcknowledgmentBanner",
    group: "sections",
    file: "cookie-acknowledgment-banner.png",
  },
  { key: "FaqSection", group: "sections", file: "faq-section.png" },
  {
    key: "HowItWorksSection",
    group: "sections",
    file: "how-it-works-section.png",
  },
  {
    key: "ComparisonTableSection",
    group: "sections",
    file: "comparison-table-section.png",
  },
  {
    key: "BeforeAfterSection",
    group: "sections",
    file: "before-after-section.png",
  },
  {
    key: "BrowserCarouselSection",
    group: "sections",
    file: "browser-carousel-section.png",
  },
  {
    key: "VideoEmbedSection",
    group: "sections",
    file: "video-embed-section.png",
    delayMs: 5000,
  },
  { key: "GalleryGrid", group: "sections", file: "gallery-grid.png" },
  { key: "GalleryCarousel", group: "sections", file: "gallery-carousel.png" },
  {
    key: "BookingSection",
    group: "sections",
    file: "booking-section.png",
    delayMs: 5_000,
  },
] as const satisfies readonly TemplatePreviewEntry[];

const LAYOUT_PACKS = [
  "salon",
  "tattoo",
  "spa",
  "coach",
  "fitness",
  "photography",
  "clinic",
  "pet",
  "home_services",
  "professional",
  "salon_b",
  "tattoo_b",
  "spa_b",
  "coach_b",
  "fitness_b",
  "photography_b",
  "clinic_b",
  "pet_b",
  "home_services_b",
  "professional_b",
  "salon_c",
  "tattoo_c",
  "spa_c",
  "coach_c",
  "fitness_c",
  "photography_c",
  "clinic_c",
  "pet_c",
  "home_services_c",
  "professional_c",
] as const;

const LAYOUT_KINDS = ["home", "booking", "service", "about", "terms"] as const;

const OVERLAY_HEROES: PackHeroKind[] = [
  "centered",
  "overlay",
  "leftOverlay",
  "video",
];

export function layoutPreviewHeaderVariant(
  packId: (typeof LAYOUT_PACKS)[number],
  layoutKind: (typeof LAYOUT_KINDS)[number],
): "solid" | "transparent" {
  if (layoutKind !== "home") return "solid";
  const hero = WEBSITE_PACKS[packId]?.hero;
  return hero && OVERLAY_HEROES.includes(hero) ? "transparent" : "solid";
}

export function packUsesOverlayHeader(hero: PackHeroKind): boolean {
  return OVERLAY_HEROES.includes(hero);
}

export const LAYOUT_TEMPLATE_PREVIEWS = LAYOUT_PACKS.flatMap((packId) =>
  LAYOUT_KINDS.map((layoutKind) => {
    const header = layoutPreviewHeaderVariant(packId, layoutKind);
    return {
      key: `Layout_${packId}_${layoutKind}`,
      group: "layouts" as const,
      file: `${packId}-${layoutKind}.png`,
      delayMs: layoutKind === "booking" ? 5_000 : 3_000,
      chrome: {
        supported: true as const,
        header,
        footer: true,
      },
    } satisfies TemplatePreviewEntry;
  }),
);

/** Install-only full-page copies (same keys; different output group/file path). */
export const LAYOUT_FULL_PAGE_PREVIEWS = LAYOUT_TEMPLATE_PREVIEWS.map(
  (entry) =>
    ({
      ...entry,
      group: "layouts-full" as const,
      file: entry.file,
    }) satisfies TemplatePreviewEntry,
);

export const TEMPLATE_PREVIEWS = [
  ...MARKETING_TEMPLATE_PREVIEWS,
  ...HERO_TEMPLATE_PREVIEWS,
  ...SECTION_TEMPLATE_PREVIEWS,
  ...LAYOUT_TEMPLATE_PREVIEWS,
] as const;

export type TemplatePreviewKey = (typeof TEMPLATE_PREVIEWS)[number]["key"];

export type SectionTemplatePreviewKey =
  (typeof SECTION_TEMPLATE_PREVIEWS)[number]["key"];

export const SECTION_TEMPLATE_PREVIEW_BASE = `${TEMPLATE_PREVIEW_BASE}/sections`;

export function templatePreviewPath(
  group: TemplatePreviewGroup,
  file: string,
): string {
  return `${TEMPLATE_PREVIEW_BASE}/${group}/${file}`;
}

export function marketingTemplatePreviewPath(file: string): string {
  return templatePreviewPath("marketing", file);
}

export function heroTemplatePreviewPath(file: string): string {
  return templatePreviewPath("heroes", file);
}

export function sectionTemplatePreviewPath(file: string): string {
  return templatePreviewPath("sections", file);
}

export function layoutTemplatePreviewPath(file: string): string {
  return templatePreviewPath("layouts", file);
}

export function layoutFullPagePreviewPath(file: string): string {
  return templatePreviewPath("layouts-full", file);
}

const previewByKey = new Map(
  TEMPLATE_PREVIEWS.map(
    (entry) =>
      [entry.key, entry] as const as [TemplatePreviewKey, TemplatePreviewEntry],
  ),
);

export function getTemplatePreviewDelayMs(
  templateKey: TemplatePreviewKey,
): number {
  return previewByKey.get(templateKey)?.delayMs ?? 3000;
}

export function getTemplatePreviewChrome(
  templateKey: string,
): TemplatePreviewChrome | undefined {
  return previewByKey.get(templateKey as TemplatePreviewKey)?.chrome;
}
