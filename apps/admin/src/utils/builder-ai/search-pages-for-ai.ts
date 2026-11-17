import type { IPagesService } from "@hacado/types";

export type PageSearchItem = {
  id: string;
  title: string;
  slug: string;
  href: string;
  published: boolean;
};

export type PageSearchResult = {
  available: boolean;
  items: PageSearchItem[];
  hint?: string;
};

function pageHref(slug: string): string {
  if (!slug || slug === "home") return "/";

  return `/${slug}`.replace(/\/{2,}/g, "/");
}

export async function searchPagesForAI(
  pagesService: IPagesService,
  input: {
    query?: string;
    limit?: number;
    publishedOnly?: boolean;
  },
): Promise<PageSearchResult> {
  const limit = Math.min(40, Math.max(1, Math.floor(input.limit ?? 20)));
  const publishedOnly = input.publishedOnly !== false;
  const query = input.query?.trim() ?? "";

  const result = await pagesService.getPages({
    search: query || undefined,
    limit,
    offset: 0,
    publishStatus: publishedOnly ? [true] : undefined,
  });

  const items = result.items.map((page) => ({
    id: String(page._id),
    title: page.title,
    slug: page.slug,
    href: pageHref(page.slug),
    published: Boolean(page.published),
  }));

  return {
    available: true,
    items,
    hint: items.length
      ? "Use item.href for Button/Link props (internal paths). Prefer /book for booking CTAs when a book page exists."
      : "No matching pages. Prefer /book for booking CTAs; do not invent slugs.",
  };
}
