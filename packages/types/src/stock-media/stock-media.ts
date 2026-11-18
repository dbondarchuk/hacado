import type { PexelsSearchResult } from "../pexels/pexels";
import type { UnsplashSearchResult } from "../unsplash/unsplash";

export type StockMediaProviderName = "unsplash" | "pexels";

/** Filter for AI search helpers (`all` = configured providers in preferred order). */
export type StockMediaProviderFilter = StockMediaProviderName | "all";

export type StockMediaType = "photo" | "video";

export type StockImageItem = {
  id: string;
  provider: StockMediaProviderName;
  url: string;
  thumbUrl?: string;
  alt: string;
  width?: number;
  height?: number;
  credit?: string;
};

export type StockImageSearchResult = {
  available: boolean;
  providers: StockMediaProviderName[];
  items: StockImageItem[];
  hint?: string;
};

export type StockVideoItem = {
  id: string;
  provider: Extract<StockMediaProviderName, "pexels">;
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
  providers: Array<Extract<StockMediaProviderName, "pexels">>;
  items: StockVideoItem[];
  hint?: string;
};

export type StockMediaSearchInput = {
  provider: StockMediaProviderName;
  mediaType: StockMediaType;
  query?: string;
  page?: number;
  perPage?: number;
};

export type StockMediaProviderSearchResult =
  | UnsplashSearchResult
  | PexelsSearchResult;

export type StockMediaTrackDownloadInput = {
  provider: StockMediaProviderName;
  downloadLocation: string;
};

/**
 * Facade over Unsplash + Pexels. Provider-native `search` / `trackDownload`
 * serve admin HTTP; `searchImages` / `searchVideos` are AI-oriented helpers.
 */
export interface IStockMediaProvider {
  isConfigured(provider: StockMediaProviderName): boolean;

  /** Whether the provider can serve the given media type (e.g. Unsplash has no video). */
  supportsMediaType(
    provider: StockMediaProviderName,
    mediaType: StockMediaType,
  ): boolean;

  /**
   * Provider-native search for admin UI / HTTP.
   * Caller must check `supportsMediaType` first (HTTP returns 405 when unsupported).
   */
  search(input: StockMediaSearchInput): Promise<StockMediaProviderSearchResult>;

  /**
   * Attribution / download tracking. Unsplash requires a valid downloadLocation;
   * providers that do not track (Pexels) no-op.
   */
  trackDownload(input: StockMediaTrackDownloadInput): Promise<void>;

  searchImages(input: {
    query: string;
    count?: number;
    provider?: StockMediaProviderFilter;
  }): Promise<StockImageSearchResult>;

  searchVideos(input: {
    query: string;
    count?: number;
    provider?: StockMediaProviderFilter;
  }): Promise<StockVideoSearchResult>;
}
