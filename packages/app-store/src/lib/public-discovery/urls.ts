export function pageMarkdownPath(slug: string): string {
  if (!slug || slug === "home") return "/index.md";
  return `/${slug.replace(/^\/+/, "")}.md`;
}

export function pageHtmlPath(slug: string): string {
  if (!slug || slug === "home") return "/";
  return `/${slug.replace(/^\/+/, "")}`;
}

export function toAbsoluteUrl(websiteUrl: string, path: string): string {
  const base = websiteUrl.replace(/\/$/, "");
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function toAbsoluteWebsiteUrl(
  websiteUrl: string,
  pathOrUrl: string,
): string {
  const trimmed = pathOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = websiteUrl.replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
