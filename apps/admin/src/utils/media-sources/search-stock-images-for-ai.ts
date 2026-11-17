import type { Redis } from "ioredis";
import { PexelsService } from "./pexels.service";
import { UnsplashService } from "./unsplash.service";

export type StockImageProvider = "unsplash" | "pexels";

export type StockImageItem = {
  id: string;
  provider: StockImageProvider;
  url: string;
  thumbUrl?: string;
  alt: string;
  width?: number;
  height?: number;
  credit?: string;
};

export type StockImageSearchResult = {
  available: boolean;
  providers: StockImageProvider[];
  items: StockImageItem[];
  hint?: string;
};

/**
 * Search Unsplash then Pexels for Builder AI Image/gallery fills.
 * Returned Unsplash photos are treated as selected (download tracked).
 */
export async function searchStockImagesForAI(
  redis: Redis,
  input: { query: string; count?: number },
): Promise<StockImageSearchResult> {
  const count = Math.min(12, Math.max(1, Math.floor(input.count ?? 6)));
  const query = input.query.trim();
  const unsplash = new UnsplashService(redis);
  const pexels = new PexelsService(redis);
  const providers: StockImageProvider[] = [];

  if (unsplash.isConfigured()) providers.push("unsplash");
  if (pexels.isConfigured()) providers.push("pexels");

  if (!providers.length) {
    return {
      available: false,
      providers: [],
      items: [],
      hint: "Stock image search is not configured. Leave Image src as schema defaults/placeholders; do not invent Unsplash or Pexels URLs.",
    };
  }

  const items: StockImageItem[] = [];

  if (unsplash.isConfigured() && items.length < count) {
    const needed = count - items.length;
    const result = await unsplash.searchPhotos({
      query: query || undefined,
      page: 1,
      perPage: needed,
    });

    for (const photo of result.items) {
      if (items.length >= count) break;

      void unsplash.trackDownload(photo.downloadLocation).catch(() => undefined);

      items.push({
        id: `unsplash:${photo.id}`,
        provider: "unsplash",
        url: photo.urls.regular,
        thumbUrl: photo.urls.thumb,
        alt: photo.alt?.trim() || query || "Stock photo",
        width: photo.width,
        height: photo.height,
        credit: photo.photographer.name,
      });
    }
  }

  if (pexels.isConfigured() && items.length < count) {
    const needed = count - items.length;
    const result = await pexels.searchPhotos({
      query: query || undefined,
      page: 1,
      perPage: needed,
    });

    for (const media of result.items) {
      if (items.length >= count) break;
      if (media.type !== "photo") continue;

      items.push({
        id: `pexels:${media.id}`,
        provider: "pexels",
        url: media.url,
        thumbUrl: media.previewUrl,
        alt: media.alt?.trim() || query || "Stock photo",
        width: media.width,
        height: media.height,
        credit: media.photographer.name,
      });
    }
  }

  return {
    available: true,
    providers,
    items,
    hint: items.length
      ? "Use each item.url as Image props.src and item.alt as props.alt. Prefer distinct items across a gallery."
      : "No stock photos matched. Broaden the query or keep schema placeholders; do not invent CDN URLs.",
  };
}
