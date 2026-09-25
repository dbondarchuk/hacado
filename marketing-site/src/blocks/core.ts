/** Shared constants, ids, and style helpers for block factories. */

export const SIGNUP_URL = "https://app.hacado.com/auth/signup";
export const SIGNIN_URL = "https://app.hacado.com/auth/signin";
export const DOCS_URL = "https://docs.hacado.com";
/** Public gallery of full-site template demos (admin app). */
export const TEMPLATE_PREVIEWS_URL =
  "https://app.hacado.com/template-previews";
export const SUPPORT_EMAIL = "support@hacado.com";
export const GITHUB_ISSUES_URL =
  "https://github.com/dbondarchuk/hacado/issues/new";

/**
 * Keep content paths as relative `/assets/...` (matches `public/assets` in the
 * Vite prototype). Seed uploads those files as org assets and rewrites to
 * `/assets/{marketing-...filename}` before Mongo upsert.
 */
export function assetUrl(src: string) {
  if (!src || /^https?:\/\//i.test(src) || src.startsWith("data:")) {
    return src;
  }
  return src.startsWith("/") ? src : `/${src}`;
}

export const C = {
  primary: "var(--value-primary-color)",
  primaryFg: "var(--value-primary-foreground-color)",
  background: "var(--value-background-color)",
  muted: "var(--value-muted-color)",
  mutedFg: "var(--value-muted-foreground-color)",
  accent: "var(--value-accent-color)",
  card: "var(--value-card-color)",
  foreground: "var(--value-foreground-color)",
  border: "var(--value-border-color)",
  secondary: "var(--value-secondary-color)",
  brand: "30 53.8% 54.1%",
  white: "0 0% 100%",
};

let seq = 0;

export function resetIds() {
  seq = 0;
}

export function bid() {
  seq += 1;
  return `block-${String(seq).padStart(5, "0")}`;
}

export function block(
  type: string,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>,
) {
  return metadata
    ? { type, id: bid(), data, metadata }
    : { type, id: bid(), data };
}

export function sv(value: unknown, extra: Record<string, unknown> = {}) {
  return [{ value, ...extra }];
}

export function pad(
  top: number,
  right: number,
  bottom: number,
  left: number,
  unit: "rem" | "px" | "vw" = "rem",
) {
  return sv({
    top: { value: top, unit },
    right: { value: right, unit },
    bottom: { value: bottom, unit },
    left: { value: left, unit },
  });
}

export function gap(n: number, unit: "rem" | "px" = "rem") {
  return sv({ value: n, unit });
}

export function size(n: number, unit: "rem" | "px" | "%" | "vw" = "rem") {
  return sv({ value: n, unit });
}

/** PageHero h1: 2.25rem, 3.75rem from md up. */
export const heroHeadingFontSize = [
  { value: { value: 2.25, unit: "rem" } },
  { value: { value: 3.75, unit: "rem" }, breakpoint: ["md"] },
];

export function radius(px = 16) {
  return sv({ value: px, unit: "px" });
}

export const emptyPad = pad(0, 0, 0, 0);
