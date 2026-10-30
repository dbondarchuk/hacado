import * as z from "zod";
import allFonts from "./fonts.json";

/** Runtime font family list. Typed as string[] on purpose (not 1885 literals). */
export const fontsNames: string[] = allFonts.items.map((font) => font.family);

export const fontsOptions = allFonts.items.reduce(
  (acc, font) => {
    acc[font.family] = {
      variants: font.variants,
      subsets: font.subsets,
      category: font.category,
    };
    return acc;
  },
  {} as Record<
    string,
    { variants: string[]; subsets: string[]; category: string }
  >,
);

const knownFontNames = new Set(fontsNames);

/**
 * Runtime check against the Google Fonts catalog; public type is string so
 * Zod inference does not expand every family name into consumers.
 */
export const fontName = z
  .string({ error: "configuration.styling.fonts.unknown" })
  .refine((name) => knownFontNames.has(name), {
    error: "configuration.styling.fonts.unknown",
  });
