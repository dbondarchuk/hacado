import { getLoggerFactory } from "@hacado/logger";
import type {
  IStockMediaProvider,
  StockImageItem,
  StockImageSearchResult,
  StockMediaProviderFilter,
  StockMediaProviderName,
  StockMediaProviderSearchResult,
  StockMediaSearchInput,
  StockMediaTrackDownloadInput,
  StockMediaType,
  StockVideoItem,
  StockVideoSearchResult,
} from "@hacado/types/stock-media";
import type { Redis } from "ioredis";
import { PexelsService } from "./pexels.service";
import { UnsplashService } from "./unsplash.service";

export class StockMediaProvider implements IStockMediaProvider {
  private readonly unsplash: UnsplashService;
  private readonly pexels: PexelsService;
  private readonly loggerFactory = getLoggerFactory("StockMediaProvider");

  public constructor(redis: Redis) {
    this.unsplash = new UnsplashService(redis);
    this.pexels = new PexelsService(redis);
  }

  public isConfigured(provider: StockMediaProviderName): boolean {
    if (provider === "unsplash") return this.unsplash.isConfigured();

    return this.pexels.isConfigured();
  }

  public supportsMediaType(
    provider: StockMediaProviderName,
    mediaType: StockMediaType,
  ): boolean {
    if (provider === "unsplash") return mediaType === "photo";

    return mediaType === "photo" || mediaType === "video";
  }

  public async search(
    input: StockMediaSearchInput,
  ): Promise<StockMediaProviderSearchResult> {
    const logger = this.loggerFactory("search");
    logger.debug(
      {
        provider: input.provider,
        mediaType: input.mediaType,
        query: input.query,
        page: input.page,
        perPage: input.perPage,
        configured: this.isConfigured(input.provider),
      },
      "Searching stock media",
    );

    if (!this.supportsMediaType(input.provider, input.mediaType)) {
      logger.warn(
        { provider: input.provider, mediaType: input.mediaType },
        "Unsupported stock media type",
      );

      throw new Error(
        `${input.provider} does not support media type ${input.mediaType}`,
      );
    }

    const paging = {
      query: input.query,
      page: input.page,
      perPage: input.perPage,
    };

    try {
      const result =
        input.provider === "unsplash"
          ? await this.unsplash.searchPhotos(paging)
          : input.mediaType === "video"
            ? await this.pexels.searchVideos(paging)
            : await this.pexels.searchPhotos(paging);

      logger.debug(
        {
          provider: input.provider,
          mediaType: input.mediaType,
          resultCount: result.items.length,
          total: result.total,
        },
        "Stock media search completed",
      );

      return result;
    } catch (error) {
      logger.error(
        {
          err: error,
          provider: input.provider,
          mediaType: input.mediaType,
          query: input.query,
        },
        "Stock media search failed",
      );

      throw error;
    }
  }

  public async trackDownload(
    input: StockMediaTrackDownloadInput,
  ): Promise<void> {
    const logger = this.loggerFactory("trackDownload");

    if (input.provider === "pexels") {
      logger.debug(
        { provider: input.provider },
        "Skipping Pexels download track",
      );

      return;
    }

    if (!this.unsplash.isValidDownloadLocation(input.downloadLocation)) {
      logger.warn(
        { downloadLocation: input.downloadLocation },
        "Invalid Unsplash download location",
      );

      throw new Error("Invalid download location");
    }

    await this.unsplash.trackDownload(input.downloadLocation);
  }

  public async searchImages(input: {
    query: string;
    count?: number;
    provider?: StockMediaProviderFilter;
  }): Promise<StockImageSearchResult> {
    const logger = this.loggerFactory("searchImages");
    const count = Math.min(12, Math.max(1, Math.floor(input.count ?? 6)));
    const query = input.query.trim();
    const filter = input.provider ?? "all";
    const providers = this.resolveImageProviders(filter);

    logger.debug(
      { query, count, filter, providers },
      "Aggregated stock image search",
    );

    if (!providers.length) {
      logger.warn({ filter }, "No stock image providers configured");
      return {
        available: false,
        providers: [],
        items: [],
        hint: "Stock image search is not configured. Leave Image src as schema defaults/placeholders; do not invent Unsplash or Pexels URLs.",
      };
    }

    const items: StockImageItem[] = [];

    if (providers.includes("unsplash") && items.length < count) {
      const needed = count - items.length;
      const result = await this.unsplash.searchPhotos({
        query: query || undefined,
        page: 1,
        perPage: needed,
      });

      for (const photo of result.items) {
        if (items.length >= count) break;

        // void this.unsplash
        //   .trackDownload(photo.downloadLocation)
        //   .catch(() => undefined);

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

    if (providers.includes("pexels") && items.length < count) {
      const needed = count - items.length;
      const result = await this.pexels.searchPhotos({
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

    logger.debug(
      { query, count, filter, providers, resultCount: items.length },
      "Aggregated stock image search completed",
    );

    return {
      available: true,
      providers,
      items,
      hint: items.length
        ? "Use each item.url as Image props.src and item.alt as props.alt. Prefer distinct items across a gallery."
        : "No stock photos matched. Broaden the query or keep schema placeholders; do not invent CDN URLs.",
    };
  }

  public async searchVideos(input: {
    query: string;
    count?: number;
    provider?: StockMediaProviderFilter;
  }): Promise<StockVideoSearchResult> {
    const logger = this.loggerFactory("searchVideos");
    const count = Math.min(12, Math.max(1, Math.floor(input.count ?? 6)));
    const query = input.query.trim();
    const filter = input.provider ?? "all";
    const providers: Array<"pexels"> = [];

    if (
      (filter === "all" || filter === "pexels") &&
      this.pexels.isConfigured()
    ) {
      providers.push("pexels");
    }

    logger.debug(
      { query, count, filter, providers },
      "Aggregated stock video search",
    );

    if (!providers.length) {
      logger.warn({ filter }, "No stock video providers configured");
      return {
        available: false,
        providers: [],
        items: [],
        hint: "Stock video search is not configured. Leave Video src as schema defaults/placeholders; do not invent Pexels CDN URLs.",
      };
    }

    const items: StockVideoItem[] = [];
    const result = await this.pexels.searchVideos({
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

    logger.debug(
      { query, count, filter, providers, resultCount: items.length },
      "Aggregated stock video search completed",
    );

    return {
      available: true,
      providers,
      items,
      hint: items.length
        ? "Use each item.url as Video props.src (or backgroundVideo src) and item.posterUrl as props.poster when useful. Prefer distinct items."
        : "No stock videos matched. Broaden the query or keep schema placeholders; do not invent CDN URLs.",
    };
  }

  private resolveImageProviders(
    filter: StockMediaProviderFilter,
  ): StockMediaProviderName[] {
    const providers: StockMediaProviderName[] = [];

    if (
      (filter === "all" || filter === "unsplash") &&
      this.unsplash.isConfigured()
    ) {
      providers.push("unsplash");
    }

    if (
      (filter === "all" || filter === "pexels") &&
      this.pexels.isConfigured()
    ) {
      providers.push("pexels");
    }

    return providers;
  }
}
