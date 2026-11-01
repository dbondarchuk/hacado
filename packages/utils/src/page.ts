function generateFakeValue(paramName: string): string {
  const lower = paramName.toLowerCase();

  if (lower.includes("id")) return "123";
  if (lower.includes("slug")) return "example-slug";
  if (lower.includes("title")) return "my-post";
  if (lower.includes("name")) return "john-doe";
  if (lower.includes("uuid")) return "550e8400-e29b";

  // fallback
  return Math.random().toString(36).substring(2, 15);
}

export function generateSlugPreview(slug?: string | null) {
  if (!slug) return { path: "", params: {} };

  const parts = slug.replace(/^\/+|\/+$/g, "").split("/");

  const params: Record<string, string> = {};

  const previewParts = parts.map((part) => {
    const match = part.match(/^\[([a-zA-Z0-9_-]+)\]$/);
    if (!match) {
      return part;
    }

    const paramName = match[1];

    // Generate fake values based on param name
    const fakeValue = generateFakeValue(paramName);
    params[paramName] = fakeValue;

    return fakeValue;
  });

  return {
    path: previewParts.join("/"),
    params,
  };
}
