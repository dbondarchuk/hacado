import type { Redis } from "ioredis";
import { PexelsService } from "./pexels.service";

export type StockVideoProvider = "pexels";

export type StockVideoItem = {
  id: string;
  provider: StockVideoProvider;
  url: string;
  posterUrl?: string;
  alt: string;
  width?: number;
  height?: number;
  mimeType?: string;
  credit?: string;
};

export type StockVideoSearchResult = {
  available: boolean;
  providers: StockVideoProvider[];
  items: StockVideoItem[];
  hint?: string;
};

/**
 * Search Pexels videos for Builder AI Video / backgroundVideo fills.
 */
export async function searchStockVideosForAI(
  redis: Redis,
  input: { query: string; count?: number },
): Promise<StockVideoSearchResult> {
  const count = Math.min(12, Math.max(1, Math.floor(input.count ?? 6)));
  const query = input.query.trim();
  const pexels = new PexelsService(redis);
  const providers: StockVideoProvider[] = [];

  if (pexels.isConfigured()) providers.push("pexels");

  if (!providers.length) {
    return {
      available: false,
      providers: [],
      items: [],
      hint: "Stock video search is not configured. Leave Video src as schema defaults/placeholders; do not invent Pexels CDN URLs.",
    };
  }

  const items: StockVideoItem[] = [];
  const result = await pexels.searchVideos({
    query: query || undefined,
    page: 1,
    perPage: count,
  });

  for (const media of result.items) {
    if (items.length >= count) break;
    if (media.type !== "video") continue;

    items.push({
      id: `pexels:${media.id}`,
      provider: "pexels",
      url: media.url,
      posterUrl: media.previewUrl,
      alt: media.alt?.trim() || query || "Stock video",
      width: media.width,
      height: media.height,
      mimeType: media.mimeType,
      credit: media.photographer.name,
    });
  }

  return {
    available: true,
    providers,
    items,
    hint: items.length
      ? "Use each item.url as Video props.src (or backgroundVideo src) and item.posterUrl as props.poster when useful. Prefer distinct items."
      : "No stock videos matched. Broaden the query or keep schema placeholders; do not invent CDN URLs.",
  };
}
