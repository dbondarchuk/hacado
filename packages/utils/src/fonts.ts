import { fontsOptions } from "@hacado/types";

export { getWebfontPreviewFilename } from "./font-preview-filename";

/** Primary / secondary fonts when styling has no overrides (web booking layout). */
export const DEFAULT_WEB_PRIMARY_FONT = "Montserrat";
export const DEFAULT_WEB_SECONDARY_FONT = "Playfair Display";

export const buildGoogleFontsUrl = (
  ...fonts: (string | undefined)[]
): string => {
  const families = fonts
    .filter(
      (fontName): fontName is string => !!fontName && fontName in fontsOptions,
    )
    .map((fontName) => {
      const font = fontsOptions[fontName];
      const family = fontName.replace(/ /g, "+");

      const variantParams = font.variants
        .map((v) => {
          if (v === "regular") return "0,400";
          if (v === "italic") return "1,400";
          const match = v.match(/^(\d+)(italic)?$/);
          if (match) {
            const weight = match[1];
            const isItalic = !!match[2];
            return `${isItalic ? 1 : 0},${weight}`;
          }
          return null;
        })
        .filter(Boolean)
        .join(";");

      if (variantParams) {
        return `family=${family}:ital,wght@${variantParams}`;
      }
      return `family=${family}`;
    });

  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
};
