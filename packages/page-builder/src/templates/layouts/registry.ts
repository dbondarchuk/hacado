import type { BaseAllKeys } from "@hacado/i18n";
import { PACK_MEDIA } from "./media";
import type { WebsitePackDefinition, WebsitePackId } from "./types";

function svc(
  packId: WebsitePackId,
  id: string,
  slug: string,
  keywords: string[],
) {
  return {
    id,
    slug,
    keywords,
    nameKey:
      `builder.pageBuilder.pageTemplates.${packId}.services.${id}.name` as BaseAllKeys,
    descriptionKey:
      `builder.pageBuilder.pageTemplates.${packId}.services.${id}.description` as BaseAllKeys,
  };
}

function pack(
  def: Omit<WebsitePackDefinition, "media" | "displayName" | "category"> & {
    id: WebsitePackId;
  },
): WebsitePackDefinition {
  return {
    ...def,
    media: PACK_MEDIA[def.id],
    displayName:
      `builder.pageBuilder.pageTemplates.packs.${def.id}.name` as BaseAllKeys,
    category:
      `builder.pageBuilder.pageTemplates.packs.${def.id}.category` as BaseAllKeys,
  };
}

export const WEBSITE_PACKS: Record<WebsitePackId, WebsitePackDefinition> = {
  salon: pack({
    id: "salon",
    installCategories: ["beauty"],
    hero: "split",
    homeMix: ["zigzag", "gallery", "testimonials", "cta"],
    serviceExtra: "beforeAfter",
    demoServices: [
      svc("salon", "cut", "signature-cut-style", ["cut", "hair"]),
      svc("salon", "color", "color-refresh", ["color"]),
      svc("salon", "nails", "gel-manicure", ["nails", "gel"]),
      svc("salon", "blowout", "express-blowout", ["blowout", "style"]),
    ],
  }),
  tattoo: pack({
    id: "tattoo",
    installCategories: ["creative"],
    hero: "overlay",
    homeMix: ["bento", "beforeAfter", "logoMarquee", "cta"],
    serviceExtra: "beforeAfter",
    demoServices: [
      svc("tattoo", "fineLine", "fine-line-tattoo", ["fine", "line"]),
      svc("tattoo", "blackwork", "blackwork-session", ["blackwork"]),
      svc("tattoo", "coverUp", "cover-up-consult", ["cover"]),
      svc("tattoo", "touchUp", "touch-up-visit", ["touch"]),
    ],
  }),
  spa: pack({
    id: "spa",
    installCategories: ["welness"],
    hero: "centered",
    homeMix: ["featureList", "carousel", "stats", "cta"],
    serviceExtra: "gallery",
    demoServices: [
      svc("spa", "massage", "deep-tissue-massage", ["massage"]),
      svc("spa", "facial", "hydrating-facial", ["facial"]),
      svc("spa", "stone", "hot-stone-ritual", ["stone"]),
      svc("spa", "couples", "couples-escape", ["couples"]),
    ],
  }),
  coach: pack({
    id: "coach",
    installCategories: ["coaching"],
    hero: "minimal",
    homeMix: ["howItWorks", "testimonials", "pricing", "cta"],
    serviceExtra: "video",
    demoServices: [
      svc("coach", "leadership", "leadership-session", ["leadership"]),
      svc("coach", "career", "career-pivot-package", ["career"]),
      svc("coach", "team", "team-offsite", ["team"]),
      svc("coach", "checkIn", "accountability-check-in", ["accountability"]),
    ],
  }),
  fitness: pack({
    id: "fitness",
    installCategories: ["fitness"],
    hero: "split",
    homeMix: ["stats", "gallery", "faqTeaser", "cta"],
    serviceExtra: "gallery",
    demoServices: [
      svc("fitness", "pt", "personal-training", ["personal", "training"]),
      svc("fitness", "hiit", "small-group-hiit", ["hiit", "group"]),
      svc("fitness", "mobility", "mobility-reset", ["mobility"]),
      svc("fitness", "nutrition", "nutrition-kickstart", ["nutrition"]),
    ],
  }),
  photography: pack({
    id: "photography",
    installCategories: ["creative"],
    hero: "galleryFirst",
    homeMix: ["carousel", "testimonials", "cta", "gallery"],
    serviceExtra: "gallery",
    demoServices: [
      svc("photography", "portrait", "portrait-session", ["portrait"]),
      svc("photography", "brand", "brand-story-day", ["brand"]),
      svc("photography", "event", "event-coverage", ["event"]),
      svc("photography", "product", "product-pack", ["product"]),
    ],
  }),
  clinic: pack({
    id: "clinic",
    installCategories: ["medical"],
    hero: "announcementSplit",
    homeMix: ["howItWorks", "faq", "cta", "stats"],
    serviceExtra: "video",
    demoServices: [
      svc("clinic", "checkup", "annual-checkup", ["checkup"]),
      svc("clinic", "urgent", "urgent-care-visit", ["urgent"]),
      svc("clinic", "vaccine", "vaccination", ["vaccine"]),
      svc("clinic", "telehealth", "telehealth-follow-up", ["telehealth"]),
    ],
  }),
  pet: pack({
    id: "pet",
    installCategories: ["pet"],
    hero: "split",
    homeMix: ["bento", "logoCloud", "testimonials", "cta"],
    serviceExtra: "gallery",
    demoServices: [
      svc("pet", "groom", "full-groom-package", ["groom"]),
      svc("pet", "walk", "neighborhood-walk", ["walk"]),
      svc("pet", "puppy", "puppy-social-hour", ["puppy"]),
      svc("pet", "nails", "nail-trim-express", ["nail"]),
    ],
  }),
  home_services: pack({
    id: "home_services",
    installCategories: ["home-services"],
    hero: "leftOverlay",
    homeMix: ["comparison", "howItWorks", "cta", "testimonials"],
    serviceExtra: "gallery",
    demoServices: [
      svc("home_services", "clean", "deep-clean", ["clean"]),
      svc("home_services", "handyman", "handyman-hour", ["handyman"]),
      svc("home_services", "install", "appliance-install", ["install"]),
      svc("home_services", "maintenance", "seasonal-maintenance", [
        "maintenance",
      ]),
    ],
  }),
  professional: pack({
    id: "professional",
    installCategories: [
      "professional",
      "education",
      "event",
      "meetings",
      "misc",
    ],
    hero: "minimal",
    homeMix: ["featuresShowcase", "stats", "testimonials", "cta"],
    serviceExtra: "video",
    demoServices: [
      svc("professional", "strategy", "strategy-consult", ["strategy"]),
      svc("professional", "books", "monthly-bookkeeping", ["bookkeeping"]),
      svc("professional", "tax", "tax-planning-review", ["tax"]),
      svc("professional", "ops", "ops-audit", ["ops"]),
    ],
  }),
};

export const WEBSITE_PACK_IDS = Object.keys(WEBSITE_PACKS) as WebsitePackId[];

export function getWebsitePack(id: WebsitePackId): WebsitePackDefinition {
  return WEBSITE_PACKS[id];
}

/** Suggest a pack from install business category / profession catalog id. */
export function suggestWebsitePackId(
  businessCategory?: string | null,
): WebsitePackId {
  const cat = (businessCategory ?? "").toLowerCase();
  for (const packDef of Object.values(WEBSITE_PACKS)) {
    if (packDef.installCategories.some((c) => cat.includes(c) || c === cat)) {
      return packDef.id;
    }
  }
  if (cat.includes("beauty") || cat.includes("salon")) return "salon";
  if (cat.includes("tattoo")) return "tattoo";
  if (
    cat.includes("spa") ||
    cat.includes("wellness") ||
    cat.includes("welness")
  )
    return "spa";
  if (cat.includes("coach")) return "coach";
  if (cat.includes("fit")) return "fitness";
  if (cat.includes("photo") || cat.includes("creative")) return "photography";
  if (cat.includes("medic") || cat.includes("clinic") || cat.includes("health"))
    return "clinic";
  if (cat.includes("pet") || cat.includes("dog") || cat.includes("groom"))
    return "pet";
  if (cat.includes("home") || cat.includes("clean") || cat.includes("handyman"))
    return "home_services";
  return "professional";
}
