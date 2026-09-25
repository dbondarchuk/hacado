import { WEBSITE_PACKS } from "./registry";
import type { PageLayoutKind, WebsitePackId } from "./types";

/** Index of all template demos. */
export const CATALOG_INDEX_PATH = "/template-previews";

/** Full-site demos live under `/template-previews/full/{series}/{pack}/…`. */
export const CATALOG_SITE_PREFIX = `${CATALOG_INDEX_PATH}/full`;

/** @deprecated use CATALOG_INDEX_PATH or CATALOG_SITE_PREFIX */
export const CATALOG_URL_PREFIX = CATALOG_INDEX_PATH;

/** Known series folders; path parsing accepts any single-letter series suffix. */
export const CATALOG_SERIES = ["a", "b", "c", "d"] as const;
export type CatalogSeries = (typeof CATALOG_SERIES)[number] | (string & {});

const LAYOUT_PAGE_SEGMENTS: Record<
  Exclude<PageLayoutKind, "home" | "service">,
  string
> = {
  booking: "book",
  about: "about",
  terms: "terms",
};

const URL_PROP_KEYS = new Set(["url", "linkHref"]);

export function isCatalogSeries(value: string): boolean {
  return /^[a-z]$/.test(value);
}

/**
 * `salon_d` → `{ series: "d", pack: "salon" }`
 * `home_services_c` → `{ series: "c", pack: "home-services" }`
 * `salon` → `{ series: "a", pack: "salon" }`
 */
export function packIdToCatalogParts(packId: WebsitePackId): {
  series: string;
  pack: string;
} {
  const parts = packId.split("_");
  const last = parts[parts.length - 1];
  if (parts.length >= 2 && last && isCatalogSeries(last)) {
    return {
      series: last,
      pack: parts.slice(0, -1).join("-"),
    };
  }

  return { series: "a", pack: parts.join("-") };
}

/** Resolve `/template-previews/full/c/salon` → `salon_c`. */
export function catalogPartsToPackId(
  series: string,
  packSlug: string,
): WebsitePackId | null {
  if (!isCatalogSeries(series)) return null;
  const base = packSlug.replaceAll("-", "_");
  const id = (series === "a" ? base : `${base}_${series}`) as WebsitePackId;
  return id in WEBSITE_PACKS ? id : null;
}

export function packIdToCatalogSlug(packId: WebsitePackId): string {
  return packIdToCatalogParts(packId).pack;
}

/** @deprecated prefer catalogPartsToPackId */
export function catalogSlugToPackId(slug: string): WebsitePackId | null {
  const id = slug.replaceAll("-", "_") as WebsitePackId;
  return id in WEBSITE_PACKS ? id : null;
}

/** Site root for a pack, e.g. `/template-previews/full/c/salon`. */
export function catalogPackBasePath(packId: WebsitePackId): string {
  const { series, pack } = packIdToCatalogParts(packId);
  return `${CATALOG_SITE_PREFIX}/${series}/${pack}`;
}

/**
 * Full catalog URL for a layout page.
 * Examples: `/template-previews/full/a/salon`, `/template-previews/full/c/salon/book`
 */
export function catalogPagePath(
  packId: WebsitePackId,
  layoutKind: PageLayoutKind,
  serviceSlug?: string,
): string {
  const base = catalogPackBasePath(packId);
  if (layoutKind === "home") return base;
  if (layoutKind === "service") {
    const slug = serviceSlug?.trim() || "service";
    return `${base}/service/${encodeURIComponent(slug)}`;
  }
  return `${base}/${LAYOUT_PAGE_SEGMENTS[layoutKind]}`;
}

export type CatalogRoute =
  | { layoutKind: "home" }
  | { layoutKind: "booking" }
  | { layoutKind: "about" }
  | { layoutKind: "terms" }
  | { layoutKind: "service"; serviceSlug: string };

/** Parse page segments after `/template-previews/{series}/{pack}/…`. */
export function parseCatalogSlug(
  segments: string[] | undefined,
): CatalogRoute | null {
  if (!segments?.length) return { layoutKind: "home" };

  const [first, second, ...rest] = segments;
  if (rest.length > 0) return null;

  if (first === "book" || first === "booking" || first === "services") {
    if (second) return null;
    return { layoutKind: "booking" };
  }
  if (first === "about") {
    if (second) return null;
    return { layoutKind: "about" };
  }
  if (first === "terms" || first === "privacy" || first === "policies") {
    if (second) return null;
    return { layoutKind: "terms" };
  }
  if (first === "service") {
    if (second) {
      return { layoutKind: "service", serviceSlug: decodeURIComponent(second) };
    }
    return { layoutKind: "service", serviceSlug: "" };
  }

  return null;
}

function isCatalogSitePath(pathname: string): boolean {
  return new RegExp(
    `^${CATALOG_SITE_PREFIX.replace(/\//g, "\\/")}/[a-z](/|$)`,
  ).test(pathname);
}

function splitPathAndQuery(href: string): { path: string; query: string } {
  const q = href.indexOf("?");
  if (q < 0) return { path: href, query: "" };
  return { path: href.slice(0, q), query: href.slice(q) };
}

/** Absolute site paths that should stay inside the catalog pack site. */
export function isCatalogInternalPath(pathname: string): boolean {
  if (!pathname.startsWith("/")) return false;
  if (isCatalogSitePath(pathname)) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/auth")) return false;
  // Index / block / full screenshot routes — not in-site page links.
  if (
    pathname === CATALOG_URL_PREFIX ||
    pathname.startsWith(`${CATALOG_URL_PREFIX}/full/`) ||
    pathname.startsWith(`${CATALOG_URL_PREFIX}/block/`)
  ) {
    return false;
  }
  // Single-segment template keys under /template-previews/{key}
  if (
    pathname.startsWith(`${CATALOG_URL_PREFIX}/`) &&
    !isCatalogSitePath(pathname)
  ) {
    const rest = pathname.slice(CATALOG_URL_PREFIX.length + 1);
    if (!rest.includes("/")) return false;
  }

  return (
    pathname === "/" ||
    pathname === "/book" ||
    pathname.startsWith("/book/") ||
    pathname === "/booking" ||
    pathname === "/services" ||
    pathname === "/about" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/policies" ||
    pathname.startsWith("/service/") ||
    pathname === "/cancel" ||
    pathname.startsWith("/cancel/") ||
    pathname === "/my-cabinet" ||
    pathname.startsWith("/my-cabinet/") ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/")
  );
}

/**
 * Map a template-absolute path (`/book`, `/service/x`) onto the pack catalog base.
 */
export function rewriteCatalogInternalPath(
  basePath: string,
  pathname: string,
): string {
  const base = basePath.replace(/\/$/, "") || `${CATALOG_SITE_PREFIX}/a/salon`;

  if (pathname === "/" || pathname === "") return base;
  if (
    pathname === "/book" ||
    pathname === "/booking" ||
    pathname === "/services" ||
    pathname.startsWith("/book/")
  ) {
    return `${base}/book`;
  }
  if (pathname === "/about") return `${base}/about`;
  if (
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/policies"
  ) {
    return `${base}/terms`;
  }
  if (pathname.startsWith("/service/")) {
    return `${base}${pathname}`;
  }
  if (
    pathname === "/cancel" ||
    pathname.startsWith("/cancel/") ||
    pathname === "/my-cabinet" ||
    pathname.startsWith("/my-cabinet/") ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/")
  ) {
    return base;
  }

  return `${base}${pathname}`;
}

function rewriteHrefString(href: string, basePath: string): string {
  const { path, query } = splitPathAndQuery(href);
  if (!isCatalogInternalPath(path)) return href;
  return `${rewriteCatalogInternalPath(basePath, path)}${query}`;
}

/** Deep-rewrite `url` / `linkHref` props so catalog demos navigate in-place. */
export function rewriteCatalogUrlsInTree<T>(value: T, basePath: string): T {
  if (value == null || typeof value !== "object") return value;

  const clone = JSON.parse(JSON.stringify(value)) as T;

  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    const record = node as Record<string, unknown>;
    for (const [key, child] of Object.entries(record)) {
      if (URL_PROP_KEYS.has(key) && typeof child === "string") {
        record[key] = rewriteHrefString(child, basePath);
        continue;
      }
      walk(child);
    }
  };

  walk(clone);
  return clone;
}
