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

function packCategoryId(id: WebsitePackId): string {
  if (id.endsWith("_b") || id.endsWith("_c")) return id.slice(0, -2);
  return id;
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
    // Series B/C share the Series A category key so all appear in one Layouts group.
    category:
      `builder.pageBuilder.pageTemplates.packs.${packCategoryId(def.id)}.category` as BaseAllKeys,
  };
}

export const WEBSITE_PACKS: Record<WebsitePackId, WebsitePackDefinition> = {
  salon: pack({
    id: "salon",
    installCategories: ["beauty"],
    hero: "centered",
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
    hero: "video",
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
    hero: "overlay",
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
  salon_b: pack({
    id: "salon_b",
    installCategories: ["beauty"],
    hero: "centered",
    homeMix: ["bento", "beforeAfter", "stats", "cta"],
    serviceExtra: "beforeAfter",
    demoServices: [
      svc("salon_b", "cut", "precision-cut", ["cut", "precision"]),
      svc("salon_b", "color", "balayage-session", ["balayage", "color"]),
      svc("salon_b", "nails", "luxury-mani", ["mani", "nails"]),
      svc("salon_b", "styling", "event-styling", ["styling", "event"]),
    ],
  }),
  tattoo_b: pack({
    id: "tattoo_b",
    installCategories: ["creative"],
    hero: "split",
    homeMix: ["zigzag", "galleryCarousel", "faq", "cta"],
    serviceExtra: "gallery",
    demoServices: [
      svc("tattoo_b", "custom", "custom-design-session", ["custom", "design"]),
      svc("tattoo_b", "fineLine", "fine-line-half-day", ["fine", "line"]),
      svc("tattoo_b", "blackwork", "large-blackwork", ["blackwork"]),
      svc("tattoo_b", "touchUp", "healed-touch-up", ["touch"]),
    ],
  }),
  spa_b: pack({
    id: "spa_b",
    installCategories: ["welness"],
    hero: "minimal",
    homeMix: ["howItWorks", "testimonials", "pricing", "cta"],
    serviceExtra: "video",
    demoServices: [
      svc("spa_b", "massage", "signature-massage", ["massage"]),
      svc("spa_b", "facial", "glow-facial", ["facial", "glow"]),
      svc("spa_b", "scrub", "steam-scrub", ["scrub", "steam"]),
      svc("spa_b", "soak", "private-soak", ["soak", "private"]),
    ],
  }),
  coach_b: pack({
    id: "coach_b",
    installCategories: ["coaching"],
    hero: "split",
    homeMix: ["featuresShowcase", "stats", "cta", "testimonials"],
    serviceExtra: "galleryCarousel",
    demoServices: [
      svc("coach_b", "intensive", "executive-intensive", [
        "executive",
        "intensive",
      ]),
      svc("coach_b", "retainer", "quarterly-retainer", [
        "retainer",
        "quarterly",
      ]),
      svc("coach_b", "manager", "new-manager-launch", ["manager", "launch"]),
      svc("coach_b", "board", "board-prep-hour", ["board", "prep"]),
    ],
  }),
  fitness_b: pack({
    id: "fitness_b",
    installCategories: ["fitness"],
    hero: "video",
    homeMix: ["bento", "beforeAfter", "logoMarquee", "cta"],
    serviceExtra: "beforeAfter",
    demoServices: [
      svc("fitness_b", "strength", "strength-block", ["strength", "personal"]),
      svc("fitness_b", "conditioning", "engine-conditioning", [
        "conditioning",
        "engine",
      ]),
      svc("fitness_b", "recovery", "recovery-flow", ["recovery", "mobility"]),
      svc("fitness_b", "team", "team-challenge", ["team", "group"]),
    ],
  }),
  photography_b: pack({
    id: "photography_b",
    installCategories: ["creative"],
    hero: "leftOverlay",
    homeMix: ["zigzag", "stats", "testimonials", "cta"],
    serviceExtra: "galleryCarousel",
    demoServices: [
      svc("photography_b", "portrait", "golden-hour-portrait", [
        "portrait",
        "golden",
      ]),
      svc("photography_b", "brand", "founder-day", ["founder", "brand"]),
      svc("photography_b", "product", "product-still-set", ["product"]),
      svc("photography_b", "event", "documentary-event", [
        "event",
        "documentary",
      ]),
    ],
  }),
  clinic_b: pack({
    id: "clinic_b",
    installCategories: ["medical"],
    hero: "leftOverlay",
    homeMix: ["featureList", "carousel", "testimonials", "cta"],
    serviceExtra: "galleryCarousel",
    demoServices: [
      svc("clinic_b", "wellness", "wellness-visit", ["wellness", "checkup"]),
      svc("clinic_b", "sick", "same-day-sick-visit", ["sick", "urgent"]),
      svc("clinic_b", "travel", "travel-clinic", ["travel", "vaccine"]),
      svc("clinic_b", "video", "video-follow-up", ["video", "telehealth"]),
    ],
  }),
  pet_b: pack({
    id: "pet_b",
    installCategories: ["pet"],
    hero: "galleryFirst",
    homeMix: ["howItWorks", "galleryCarousel", "cta", "logoCloud"],
    serviceExtra: "gallery",
    demoServices: [
      svc("pet_b", "groom", "trail-groom", ["groom", "trail"]),
      svc("pet_b", "walk", "adventure-walk", ["walk", "adventure"]),
      svc("pet_b", "puppy", "puppy-primer", ["puppy"]),
      svc("pet_b", "deshed", "deshed-express", ["deshed"]),
    ],
  }),
  home_services_b: pack({
    id: "home_services_b",
    installCategories: ["home-services"],
    hero: "announcementSplit",
    homeMix: ["bento", "stats", "faq", "cta"],
    serviceExtra: "video",
    demoServices: [
      svc("home_services_b", "clean", "weekly-clean", ["clean", "weekly"]),
      svc("home_services_b", "handyman", "punch-list-hour", [
        "punch",
        "handyman",
      ]),
      svc("home_services_b", "move", "move-ready-detail", ["move", "detail"]),
      svc("home_services_b", "fixture", "filter-fixture", [
        "fixture",
        "maintenance",
      ]),
    ],
  }),
  professional_b: pack({
    id: "professional_b",
    installCategories: [
      "professional",
      "education",
      "event",
      "meetings",
      "misc",
    ],
    hero: "leftOverlay",
    homeMix: ["comparison", "howItWorks", "pricing", "cta"],
    serviceExtra: "galleryCarousel",
    demoServices: [
      svc("professional_b", "books", "books-cleanup", ["books", "cleanup"]),
      svc("professional_b", "controller", "fractional-controller", [
        "controller",
        "fractional",
      ]),
      svc("professional_b", "process", "process-map", ["process", "ops"]),
      svc("professional_b", "tax", "tax-season-brief", ["tax"]),
    ],
  }),
  salon_c: pack({
    id: "salon_c",
    installCategories: ["beauty"],
    hero: "leftOverlay",
    mood: "bold",
    motion: true,
    homeMix: ["beforeAfter", "bento", "logoMarquee", "testimonials", "cta"],
    serviceExtra: "video",
    demoServices: [
      svc("salon_c", "blowout", "signature-blowout", ["blowout", "style"]),
      svc("salon_c", "color", "lived-in-color", ["color", "balayage"]),
      svc("salon_c", "cut", "cut-shape", ["cut", "shape"]),
      svc("salon_c", "event", "event-glam", ["event", "glam"]),
    ],
  }),
  tattoo_c: pack({
    id: "tattoo_c",
    installCategories: ["creative"],
    hero: "centered",
    mood: "dark",
    motion: true,
    homeMix: [
      "gallery",
      "featuresShowcase",
      "beforeAfter",
      "logoMarquee",
      "cta",
    ],
    serviceExtra: "beforeAfter",
    demoServices: [
      svc("tattoo_c", "fineLine", "fine-line-session", ["fine", "line"]),
      svc("tattoo_c", "blackwork", "blackwork-panel", ["blackwork"]),
      svc("tattoo_c", "custom", "custom-consult", ["custom", "consult"]),
      svc("tattoo_c", "touchUp", "healed-touch-up", ["touch", "healed"]),
    ],
  }),
  spa_c: pack({
    id: "spa_c",
    installCategories: ["welness"],
    hero: "overlay",
    mood: "muted",
    motion: true,
    homeMix: ["featureList", "video", "carousel", "pricing", "cta"],
    serviceExtra: "gallery",
    demoServices: [
      svc("spa_c", "massage", "mineral-massage", ["massage", "mineral"]),
      svc("spa_c", "facial", "botanical-facial", ["facial", "botanical"]),
      svc("spa_c", "scrub", "steam-scrub", ["scrub", "steam"]),
      svc("spa_c", "soak", "private-soak", ["soak", "private"]),
    ],
  }),
  coach_c: pack({
    id: "coach_c",
    installCategories: ["coaching"],
    hero: "split",
    mood: "light",
    motion: true,
    homeMix: ["stats", "featuresShowcase", "howItWorks", "testimonials", "cta"],
    serviceExtra: "video",
    demoServices: [
      svc("coach_c", "leadership", "leadership-intensive", [
        "leadership",
        "intensive",
      ]),
      svc("coach_c", "career", "career-pivot", ["career", "pivot"]),
      svc("coach_c", "manager", "manager-launch", ["manager", "launch"]),
      svc("coach_c", "checkIn", "accountability-hour", [
        "accountability",
        "check",
      ]),
    ],
  }),
  fitness_c: pack({
    id: "fitness_c",
    installCategories: ["fitness"],
    hero: "video",
    mood: "bold",
    motion: true,
    homeMix: ["bento", "stats", "galleryCarousel", "logoMarquee", "cta"],
    serviceExtra: "galleryCarousel",
    demoServices: [
      svc("fitness_c", "strength", "strength-block", ["strength"]),
      svc("fitness_c", "conditioning", "engine-conditioning", [
        "conditioning",
        "engine",
      ]),
      svc("fitness_c", "mobility", "mobility-reset", ["mobility", "recovery"]),
      svc("fitness_c", "team", "team-challenge", ["team", "group"]),
    ],
  }),
  photography_c: pack({
    id: "photography_c",
    installCategories: ["creative"],
    hero: "galleryFirst",
    mood: "muted",
    motion: true,
    homeMix: [
      "zigzag",
      "galleryCarousel",
      "beforeAfter",
      "testimonials",
      "cta",
    ],
    serviceExtra: "gallery",
    demoServices: [
      svc("photography_c", "portrait", "portrait-hour", ["portrait"]),
      svc("photography_c", "brand", "brand-story-day", ["brand", "story"]),
      svc("photography_c", "event", "event-coverage", ["event"]),
      svc("photography_c", "product", "product-still-set", ["product"]),
    ],
  }),
  clinic_c: pack({
    id: "clinic_c",
    installCategories: ["medical"],
    hero: "announcementSplit",
    mood: "light",
    motion: true,
    homeMix: ["howItWorks", "featureList", "faq", "stats", "cta"],
    serviceExtra: "video",
    demoServices: [
      svc("clinic_c", "wellness", "annual-wellness", ["wellness", "checkup"]),
      svc("clinic_c", "sick", "same-day-sick", ["sick", "urgent"]),
      svc("clinic_c", "travel", "travel-prep", ["travel", "vaccine"]),
      svc("clinic_c", "video", "video-follow-up", ["video", "telehealth"]),
    ],
  }),
  pet_c: pack({
    id: "pet_c",
    installCategories: ["pet"],
    hero: "centered",
    mood: "bold",
    motion: true,
    homeMix: ["bento", "beforeAfter", "gallery", "testimonials", "cta"],
    serviceExtra: "beforeAfter",
    demoServices: [
      svc("pet_c", "groom", "full-groom", ["groom"]),
      svc("pet_c", "walk", "adventure-walk", ["walk", "adventure"]),
      svc("pet_c", "puppy", "puppy-primer", ["puppy"]),
      svc("pet_c", "deshed", "deshed-express", ["deshed"]),
    ],
  }),
  home_services_c: pack({
    id: "home_services_c",
    installCategories: ["home-services"],
    hero: "leftOverlay",
    mood: "muted",
    motion: true,
    homeMix: ["comparison", "howItWorks", "faqTeaser", "logoCloud", "cta"],
    serviceExtra: "gallery",
    demoServices: [
      svc("home_services_c", "clean", "weekly-clean", ["clean", "weekly"]),
      svc("home_services_c", "handyman", "punch-list-hour", [
        "handyman",
        "punch",
      ]),
      svc("home_services_c", "move", "move-ready-detail", ["move", "detail"]),
      svc("home_services_c", "fixture", "filter-fixture", [
        "fixture",
        "filter",
      ]),
    ],
  }),
  professional_c: pack({
    id: "professional_c",
    installCategories: [
      "professional",
      "education",
      "event",
      "meetings",
      "misc",
    ],
    hero: "minimal",
    mood: "light",
    motion: true,
    homeMix: ["logoMarquee", "featuresShowcase", "stats", "pricing", "cta"],
    serviceExtra: "galleryCarousel",
    demoServices: [
      svc("professional_c", "books", "books-cleanup", ["books", "cleanup"]),
      svc("professional_c", "controller", "fractional-controller", [
        "controller",
        "fractional",
      ]),
      svc("professional_c", "process", "process-map", ["process", "ops"]),
      svc("professional_c", "tax", "tax-season-brief", ["tax"]),
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
): WebsitePackId | null {
  const cat = (businessCategory ?? "").trim().toLowerCase();
  if (!cat) return null;

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
