import type { StylingConfiguration } from "@hacado/types";
import type { WebsitePackId } from "./types";

/** Suggested brand tokens from Series A–D HTML mockups. */
export type PackTheme = {
  /** City / location eyebrow for galleryFirst heroes. */
  city?: string;
  colors: {
    primary: string;
    accent?: string;
    muted?: string;
    dark?: string;
    surface?: string;
    ink?: string;
  };
  /** Google fonts present in `fonts.json` — body → primary, display → secondary. */
  fonts: {
    primary: string;
    secondary: string;
  };
  dark?: boolean;
};

export const PACK_THEMES: Record<WebsitePackId, PackTheme> = {
  // Series A — brand hex from HTML; fonts suggested (HTML used system stacks)
  salon: {
    colors: { primary: "#7c3aed", muted: "#f5f3ff", dark: "#4c1d95" },
    fonts: { primary: "Inter", secondary: "Playfair Display" },
  },
  tattoo: {
    colors: { primary: "#dc2626", muted: "#fef2f2", dark: "#7f1d1d" },
    fonts: { primary: "IBM Plex Sans", secondary: "Oswald" },
  },
  spa: {
    colors: { primary: "#0d9488", muted: "#f0fdfa", dark: "#115e59" },
    fonts: { primary: "Source Sans 3", secondary: "Lora" },
  },
  coach: {
    colors: { primary: "#2563eb", muted: "#eff6ff", dark: "#1e3a8a" },
    fonts: { primary: "Inter", secondary: "Merriweather" },
  },
  fitness: {
    colors: { primary: "#ea580c", muted: "#fff7ed", dark: "#9a3412" },
    fonts: { primary: "Barlow", secondary: "Syne" },
  },
  photography: {
    city: "Studio",
    colors: { primary: "#4f46e5", muted: "#eef2ff", dark: "#312e81" },
    fonts: { primary: "Karla", secondary: "Literata" },
  },
  clinic: {
    colors: { primary: "#0284c7", muted: "#f0f9ff", dark: "#0c4a6e" },
    fonts: { primary: "Nunito Sans", secondary: "Fraunces" },
  },
  pet: {
    colors: { primary: "#d97706", muted: "#fffbeb", dark: "#92400e" },
    fonts: { primary: "Nunito", secondary: "Fredoka" },
  },
  home_services: {
    colors: { primary: "#059669", muted: "#ecfdf5", dark: "#065f46" },
    fonts: { primary: "Work Sans", secondary: "Sora" },
  },
  professional: {
    colors: { primary: "#334155", muted: "#f8fafc", dark: "#0f172a" },
    fonts: { primary: "Manrope", secondary: "Newsreader" },
  },
  nails: {
    city: "Studio",
    colors: { primary: "#db2777", muted: "#fdf2f8", dark: "#831843" },
    fonts: { primary: "DM Sans", secondary: "Fraunces" },
  },
  lash: {
    colors: { primary: "#78716c", muted: "#fafaf9", dark: "#292524" },
    fonts: { primary: "Source Sans 3", secondary: "Libre Baskerville" },
  },

  // Series B — packs-v2 colors; fonts suggested
  salon_b: {
    colors: { primary: "#be185d", muted: "#fdf2f8", dark: "#831843" },
    fonts: { primary: "Poppins", secondary: "Playfair Display" },
  },
  tattoo_b: {
    colors: { primary: "#171717", muted: "#fafafa", dark: "#0a0a0a" },
    fonts: { primary: "IBM Plex Sans", secondary: "Bebas Neue" },
  },
  spa_b: {
    colors: { primary: "#047857", muted: "#ecfdf5", dark: "#064e3b" },
    fonts: { primary: "Figtree", secondary: "Cormorant Garamond" },
  },
  coach_b: {
    colors: { primary: "#1d4ed8", muted: "#eff6ff", dark: "#1e3a8a" },
    fonts: { primary: "Inter", secondary: "Libre Baskerville" },
  },
  fitness_b: {
    colors: { primary: "#c2410c", muted: "#fff7ed", dark: "#7c2d12" },
    fonts: { primary: "Barlow", secondary: "Oswald" },
  },
  photography_b: {
    colors: { primary: "#4338ca", muted: "#eef2ff", dark: "#312e81" },
    fonts: { primary: "Karla", secondary: "Playfair Display" },
  },
  clinic_b: {
    colors: { primary: "#0369a1", muted: "#f0f9ff", dark: "#0c4a6e" },
    fonts: { primary: "Plus Jakarta Sans", secondary: "Fraunces" },
  },
  pet_b: {
    city: "Trail",
    colors: { primary: "#b45309", muted: "#fffbeb", dark: "#78350f" },
    fonts: { primary: "Nunito", secondary: "Outfit" },
  },
  home_services_b: {
    colors: { primary: "#0f766e", muted: "#f0fdfa", dark: "#134e4a" },
    fonts: { primary: "Work Sans", secondary: "Space Grotesk" },
  },
  professional_b: {
    colors: { primary: "#1e293b", muted: "#f8fafc", dark: "#0f172a" },
    fonts: { primary: "Manrope", secondary: "Instrument Serif" },
  },
  nails_b: {
    colors: { primary: "#f472b6", muted: "#fce7f3", dark: "#9d174d" },
    fonts: { primary: "Poppins", secondary: "Playfair Display" },
  },
  lash_b: {
    colors: { primary: "#57534e", muted: "#f5f5f4", dark: "#1c1917" },
    fonts: { primary: "Source Sans 3", secondary: "Cormorant Garamond" },
  },

  // Series C — packs-v3 colors; fonts suggested
  salon_c: {
    colors: { primary: "#e11d48", muted: "#fff1f2", dark: "#9f1239" },
    fonts: { primary: "DM Sans", secondary: "Raleway" },
  },
  tattoo_c: {
    dark: true,
    colors: {
      primary: "#fafafa",
      muted: "#18181b",
      dark: "#09090b",
      surface: "#27272a",
      ink: "#fafafa",
    },
    fonts: { primary: "IBM Plex Sans", secondary: "Syne" },
  },
  spa_c: {
    colors: { primary: "#4d7c0f", muted: "#f7fee7", dark: "#365314" },
    fonts: { primary: "Source Sans 3", secondary: "Cormorant Garamond" },
  },
  coach_c: {
    colors: { primary: "#1d4ed8", muted: "#eff6ff", dark: "#1e3a8a" },
    fonts: { primary: "Inter", secondary: "Lora" },
  },
  fitness_c: {
    colors: { primary: "#dc2626", muted: "#fef2f2", dark: "#7f1d1d" },
    fonts: { primary: "Barlow", secondary: "Oswald" },
  },
  photography_c: {
    city: "Field",
    colors: { primary: "#57534e", muted: "#fafaf9", dark: "#1c1917" },
    fonts: { primary: "Karla", secondary: "Newsreader" },
  },
  clinic_c: {
    colors: { primary: "#0284c7", muted: "#f0f9ff", dark: "#0c4a6e" },
    fonts: { primary: "Nunito Sans", secondary: "Literata" },
  },
  pet_c: {
    colors: { primary: "#ea580c", muted: "#fff7ed", dark: "#9a3412" },
    fonts: { primary: "Nunito", secondary: "Fredoka" },
  },
  home_services_c: {
    colors: { primary: "#0f766e", muted: "#f0fdfa", dark: "#134e4a" },
    fonts: { primary: "Work Sans", secondary: "Sora" },
  },
  professional_c: {
    colors: { primary: "#a16207", muted: "#fefce8", dark: "#713f12" },
    fonts: { primary: "Manrope", secondary: "Merriweather" },
  },
  nails_c: {
    dark: true,
    colors: {
      primary: "#e11d48",
      muted: "#18181b",
      dark: "#09090b",
      surface: "#27272a",
      ink: "#fafafa",
    },
    fonts: { primary: "DM Sans", secondary: "Syne" },
  },
  lash_c: {
    colors: { primary: "#a8a29e", muted: "#fafaf9", dark: "#44403c" },
    fonts: { primary: "Inter", secondary: "Literata" },
  },

  // Series D — packs-v4.mjs (colors + fonts from HTML)
  salon_d: {
    city: "Nashville",
    colors: {
      primary: "#0f172a",
      accent: "#f43f5e",
      muted: "#f8fafc",
      dark: "#020617",
      surface: "#ffffff",
      ink: "#0f172a",
    },
    fonts: { primary: "DM Sans", secondary: "Archivo Black" },
  },
  tattoo_d: {
    city: "Portland",
    dark: true,
    colors: {
      primary: "#eab308",
      accent: "#eab308",
      muted: "#18181b",
      dark: "#09090b",
      surface: "#27272a",
      ink: "#fafafa",
    },
    fonts: { primary: "IBM Plex Sans", secondary: "Bebas Neue" },
  },
  spa_d: {
    city: "Seattle",
    colors: {
      primary: "#3f6212",
      accent: "#65a30d",
      muted: "#f7fee7",
      dark: "#1a2e05",
      surface: "#ecfccb",
      ink: "#1a2e05",
    },
    fonts: { primary: "Source Sans 3", secondary: "Cormorant Garamond" },
  },
  coach_d: {
    city: "Chicago",
    colors: {
      primary: "#1e3a5f",
      accent: "#c2410c",
      muted: "#f1f5f9",
      dark: "#0f172a",
      surface: "#ffffff",
      ink: "#0f172a",
    },
    fonts: { primary: "Inter", secondary: "Libre Baskerville" },
  },
  fitness_d: {
    dark: true,
    colors: {
      primary: "#22d3ee",
      accent: "#22d3ee",
      muted: "#111827",
      dark: "#030712",
      surface: "#1f2937",
      ink: "#f9fafb",
    },
    fonts: { primary: "Barlow", secondary: "Oswald" },
  },
  photography_d: {
    city: "Denver",
    colors: {
      primary: "#44403c",
      accent: "#b45309",
      muted: "#f5f5f4",
      dark: "#1c1917",
      surface: "#ffffff",
      ink: "#1c1917",
    },
    fonts: { primary: "Karla", secondary: "Playfair Display" },
  },
  clinic_d: {
    colors: {
      primary: "#0e7490",
      accent: "#0891b2",
      muted: "#ecfeff",
      dark: "#164e63",
      surface: "#ffffff",
      ink: "#083344",
    },
    fonts: { primary: "Nunito Sans", secondary: "Fraunces" },
  },
  pet_d: {
    city: "Boulder",
    colors: {
      primary: "#c2410c",
      accent: "#ea580c",
      muted: "#fff7ed",
      dark: "#7c2d12",
      surface: "#ffedd5",
      ink: "#431407",
    },
    fonts: { primary: "Nunito", secondary: "Fredoka" },
  },
  home_services_d: {
    city: "Philadelphia",
    colors: {
      primary: "#1d4ed8",
      accent: "#2563eb",
      muted: "#eff6ff",
      dark: "#1e3a8a",
      surface: "#ffffff",
      ink: "#1e3a8a",
    },
    fonts: { primary: "Work Sans", secondary: "Space Grotesk" },
  },
  professional_d: {
    city: "Ledger Lane",
    colors: {
      primary: "#134e4a",
      accent: "#0f766e",
      muted: "#f0fdfa",
      dark: "#042f2e",
      surface: "#ffffff",
      ink: "#042f2e",
    },
    fonts: { primary: "Manrope", secondary: "Instrument Serif" },
  },
  nails_d: {
    city: "Austin",
    colors: {
      primary: "#be185d",
      accent: "#f9a8d4",
      muted: "#fdf2f8",
      dark: "#500724",
      surface: "#ffffff",
      ink: "#500724",
    },
    fonts: { primary: "DM Sans", secondary: "Fraunces" },
  },
  lash_d: {
    city: "Chicago",
    colors: {
      primary: "#44403c",
      accent: "#d6d3d1",
      muted: "#fafaf9",
      dark: "#1c1917",
      surface: "#ffffff",
      ink: "#1c1917",
    },
    fonts: { primary: "Source Sans 3", secondary: "Libre Baskerville" },
  },
};

function isLightHex(hex: string) {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

function contrastInk(hex: string, light = "#ffffff", dark = "#0f172a") {
  return isLightHex(hex) ? dark : light;
}

/** Build a full `StylingConfiguration` from pack HTML tokens (preview / install base). */
export function packThemeToStyling(theme: PackTheme): StylingConfiguration {
  const { colors, fonts, dark } = theme;
  const primary = colors.primary;
  const accent = colors.accent ?? colors.primary;
  const muted = colors.muted ?? (dark ? "#18181b" : "#f8fafc");
  const surface = colors.surface ?? (dark ? "#27272a" : "#ffffff");
  const ink = colors.ink ?? (dark ? "#fafafa" : "#0f172a");
  const darkBg = colors.dark ?? (dark ? "#09090b" : "#0f172a");
  const background = dark ? darkBg : muted;
  const foreground = ink;
  const primaryForeground = contrastInk(primary, "#ffffff", darkBg);
  const accentForeground = contrastInk(accent, "#ffffff", darkBg);

  const colorEntries: NonNullable<StylingConfiguration["colors"]> = [
    { type: "background", value: background },
    { type: "foreground", value: foreground },
    { type: "card", value: surface },
    { type: "card-foreground", value: foreground },
    { type: "popover", value: surface },
    { type: "popover-foreground", value: foreground },
    { type: "primary", value: primary },
    { type: "primary-foreground", value: primaryForeground },
    { type: "secondary", value: accent },
    { type: "secondary-foreground", value: accentForeground },
    { type: "muted", value: muted },
    {
      type: "muted-foreground",
      value: contrastInk(muted, "#e2e8f0", "#64748b"),
    },
    { type: "accent", value: accent },
    { type: "accent-foreground", value: accentForeground },
    { type: "border", value: dark ? "#3f3f46" : "#e2e8f0" },
  ];

  return {
    colors: colorEntries,
    fonts: {
      primary: fonts.primary as NonNullable<
        StylingConfiguration["fonts"]
      >["primary"],
      secondary: fonts.secondary as NonNullable<
        StylingConfiguration["fonts"]
      >["secondary"],
    },
  };
}

export function getPackSuggestedStyling(
  packId: WebsitePackId,
): StylingConfiguration {
  return packThemeToStyling(PACK_THEMES[packId]);
}

/** Org/user styling wins; pack suggested fills gaps (preview base). */
export function mergePackStylingBase(
  packId: WebsitePackId,
  override?: StylingConfiguration | null,
): StylingConfiguration {
  const base = getPackSuggestedStyling(packId);
  if (!override) return base;

  const colorTypes = new Set((override.colors ?? []).map((c) => c.type));
  const colors = [
    ...(base.colors ?? []).filter((c) => !colorTypes.has(c.type)),
    ...(override.colors ?? []),
  ];

  return {
    ...base,
    ...override,
    colors,
    fonts: {
      ...base.fonts,
      ...override.fonts,
    },
  };
}

/** Parse `Layout_salon_d_home` → pack id. */
export function packIdFromLayoutTemplateKey(
  templateKey: string,
): WebsitePackId | null {
  const match = /^Layout_(.+)_(home|booking|service|about|terms)$/.exec(
    templateKey,
  );
  if (!match) return null;
  const id = match[1] as WebsitePackId;
  return id in PACK_THEMES ? id : null;
}
