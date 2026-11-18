/** True for http(s) absolute URLs only. */
export function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Resolve designer image srcs to absolute http(s) URLs using the org website.
 * Asset filenames become `{websiteUrl}/assets/{filename}`.
 */
export function toAbsoluteImageUrl(
  src: string | undefined,
  websiteUrl: string,
): string | undefined {
  const trimmed = src?.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("pending:")) return undefined;
  if (isAbsoluteHttpUrl(trimmed)) return trimmed;

  const base = websiteUrl.replace(/\/$/, "");
  if (!base) return undefined;

  if (trimmed.startsWith("/")) {
    return `${base}${trimmed}`;
  }

  if (trimmed.startsWith("assets/") || trimmed.startsWith("files/")) {
    return `${base}/${trimmed}`;
  }

  // Bare asset filename / logo asset name
  if (!trimmed.includes("://")) {
    return `${base}/assets/${trimmed.replace(/^\/+/, "")}`;
  }

  return undefined;
}
