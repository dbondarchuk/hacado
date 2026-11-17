import type { IPagesService } from "@hacado/types/services";

export type PageChromeItem = {
  id: string;
  name: string;
  usedCount?: number;
};

export type PageChromeForAI = {
  availableHeaders: PageChromeItem[];
  availableFooters: PageChromeItem[];
};

function mapChromeItems(
  items: Array<{ _id: string; name: string; usedCount?: number }>,
): PageChromeItem[] {
  return items.map((item) => ({
    id: String(item._id),
    name: item.name,
    usedCount: item.usedCount,
  }));
}

export async function listPageChromeForAI(
  pagesService: IPagesService,
): Promise<PageChromeForAI> {
  const [headers, footers] = await Promise.all([
    pagesService.getPageHeaders({ limit: 40, offset: 0 }),
    pagesService.getPageFooters({ limit: 40, offset: 0 }),
  ]);

  return {
    availableHeaders: mapChromeItems(headers.items),
    availableFooters: mapChromeItems(footers.items),
  };
}
