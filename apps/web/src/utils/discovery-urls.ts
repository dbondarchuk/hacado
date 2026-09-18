export function pageMarkdownPath(slug: string): string {
  if (!slug || slug === "home") return "/index.md";
  return `/${slug.replace(/^\/+/, "")}.md`;
}

export function toAbsoluteUrl(websiteUrl: string, path: string): string {
  const base = websiteUrl.replace(/\/$/, "");
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
