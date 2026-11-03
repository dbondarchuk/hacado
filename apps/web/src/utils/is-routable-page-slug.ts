/**
 * Paths that should never be rendered as CMS pages. Missing `/_next/static`
 * files (e.g. source maps) fall through to `[[...slug]]` and must 404 early
 * before configuration lookups.
 */
const NON_PAGE_PREFIXES = ["_next/", "api/", "assets/"] as const;

const STATIC_FILE_EXTENSION =
  /\.(?:map|js|mjs|cjs|css|json|txt|xml|ico|png|jpe?g|gif|webp|svg|avif|woff2?|ttf|eot)$/i;

export function isRoutablePageSlug(slug?: string[] | string): boolean {
  const path = Array.isArray(slug) ? slug.join("/") : (slug ?? "");
  if (!path || path === "home") {
    return true;
  }

  if (NON_PAGE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return false;
  }

  const lastSegment = Array.isArray(slug)
    ? slug[slug.length - 1]
    : path.split("/").pop();

  if (lastSegment && STATIC_FILE_EXTENSION.test(lastSegment)) {
    return false;
  }

  return true;
}
