/**
 * Curated list of Google Fonts available in the editor.
 * Each entry maps the display name to the exact Google Fonts family string.
 *
 * To add more fonts: append to EDITOR_FONTS and add the weights you need in
 * FONT_WEIGHTS_TO_LOAD. The server renderer automatically fetches only the
 * fonts that are actually used in a given design.
 */

export interface FontEntry {
  /** Human-readable label shown in the selector */
  label: string;
  /** Exact family name used in CSS `font-family` and in Google Fonts API */
  value: string;
  /** Generic CSS fallback appended after the family name */
  fallback: string;
}

export const EDITOR_FONTS: FontEntry[] = [
  { label: "Inter", value: "Inter", fallback: "sans-serif" },
  { label: "Roboto", value: "Roboto", fallback: "sans-serif" },
  { label: "Open Sans", value: "Open Sans", fallback: "sans-serif" },
  { label: "Lato", value: "Lato", fallback: "sans-serif" },
  { label: "Montserrat", value: "Montserrat", fallback: "sans-serif" },
  { label: "Poppins", value: "Poppins", fallback: "sans-serif" },
  { label: "Nunito", value: "Nunito", fallback: "sans-serif" },
  { label: "Raleway", value: "Raleway", fallback: "sans-serif" },
  { label: "Oswald", value: "Oswald", fallback: "sans-serif" },
  { label: "Source Sans 3", value: "Source Sans 3", fallback: "sans-serif" },
  { label: "Playfair Display", value: "Playfair Display", fallback: "serif" },
  { label: "Merriweather", value: "Merriweather", fallback: "serif" },
  { label: "Lora", value: "Lora", fallback: "serif" },
  { label: "PT Serif", value: "PT Serif", fallback: "serif" },
  { label: "Libre Baskerville", value: "Libre Baskerville", fallback: "serif" },
  { label: "Dancing Script", value: "Dancing Script", fallback: "cursive" },
  { label: "Pacifico", value: "Pacifico", fallback: "cursive" },
  { label: "Great Vibes", value: "Great Vibes", fallback: "cursive" },
  { label: "JetBrains Mono", value: "JetBrains Mono", fallback: "monospace" },
  { label: "Fira Code", value: "Fira Code", fallback: "monospace" },
  // Creative / gift-card friendly (from fonts.json)
  { label: "Caveat", value: "Caveat", fallback: "cursive" },
  { label: "Sacramento", value: "Sacramento", fallback: "cursive" },
  { label: "Satisfy", value: "Satisfy", fallback: "cursive" },
  { label: "Allura", value: "Allura", fallback: "cursive" },
  { label: "Tangerine", value: "Tangerine", fallback: "cursive" },
  { label: "Cookie", value: "Cookie", fallback: "cursive" },
  {
    label: "Cormorant Garamond",
    value: "Cormorant Garamond",
    fallback: "serif",
  },
  { label: "Cormorant", value: "Cormorant", fallback: "serif" },
  { label: "Abril Fatface", value: "Abril Fatface", fallback: "serif" },
  { label: "Cinzel", value: "Cinzel", fallback: "serif" },
];

/** The CSS font-family string to store in TextStyles.fontFamily */
export function fontFamilyCss(value: string): string {
  const entry = EDITOR_FONTS.find((f) => f.value === value);
  const fallback = entry?.fallback ?? "sans-serif";
  return `"${value}", ${fallback}`;
}

/** Extract the primary family name from a stored font-family CSS string (for FontSelect value / satori). */
export function getFamilyFromStoredFont(
  stored: string | undefined,
): string | undefined {
  if (!stored?.trim()) return undefined;
  const found = EDITOR_FONTS.find((f) => stored.includes(f.value));
  if (found) return found.value;
  const quoted = stored.match(/^["']?([^"',]+)["']?/);
  return quoted ? quoted[1].trim() : undefined;
}

/**
 * Build a Google Fonts stylesheet URL for the given family names + weights.
 * Pass this URL to <link> in the client layout or use it server-side to fetch
 * font binaries for satori.
 */
export function googleFontsUrl(
  families: string[],
  weights = [400, 700],
): string {
  if (families.length === 0) return "";
  const params = families
    .map((f) => `family=${encodeURIComponent(f)}:wght@${weights.join(";")}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/**
 * Weights to pre-load on the server for satori. Adjust if you need more.
 */
export const SERVER_FONT_WEIGHTS: number[] = [400, 700];
