import { getLoggerFactory } from "@hacado/logger";
import type { UnsplashPhoto, UnsplashSearchResult } from "@hacado/types";
import type { Redis } from "ioredis";

const UNSPLASH_API_BASE = "https://api.unsplash.com";
const CACHE_KEY_PREFIX = "unsplash:search:";
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const UTM = "utm_source=hacado&utm_medium=referral";

type UnsplashApiPhoto = {
  id: string;
  alt_description: string | null;
  description: string | null;
  width: number;
  height: number;
  urls: {
    thumb: string;
    small: string;
    regular: string;
  };
  links: {
    html: string;
    download_location: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
};

type UnsplashSearchApiResponse = {
  total: number;
  results: UnsplashApiPhoto[];
};

export class UnsplashService {
  protected readonly loggerFactory = getLoggerFactory("UnsplashService");
  private readonly redis: Redis;

  public constructor(redis: Redis) {
    this.redis = redis;
  }

  public isConfigured(): boolean {
    return Boolean(process.env.UNSPLASH_ACCESS_KEY);
  }

  private getAccessKey(): string {
    const key = process.env.UNSPLASH_ACCESS_KEY;
    if (!key) {
      throw new Error("UNSPLASH_ACCESS_KEY is not configured");
    }
    return key;
  }

  private withUtm(url: string): string {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${UTM}`;
  }

  private mapPhoto(photo: UnsplashApiPhoto): UnsplashPhoto {
    return {
      id: photo.id,
      alt: photo.alt_description ?? photo.description,
      width: photo.width,
      height: photo.height,
      urls: {
        thumb: photo.urls.thumb,
        small: photo.urls.small,
        regular: photo.urls.regular,
      },
      photographer: {
        name: photo.user.name,
        profileUrl: this.withUtm(photo.user.links.html),
      },
      unsplashUrl: this.withUtm(photo.links.html),
      downloadLocation: photo.links.download_location,
    };
  }

  private cacheKey(query: string, page: number, perPage: number): string {
    const normalized = query.trim().toLowerCase();
    return `${CACHE_KEY_PREFIX}${normalized || "_editorial"}:${page}:${perPage}`;
  }

  private async fetchFromUnsplash(
    path: string,
    params: Record<string, string>,
  ): Promise<Response> {
    const url = new URL(`${UNSPLASH_API_BASE}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${this.getAccessKey()}`,
        "Accept-Version": "v1",
      },
    });
  }

  public async searchPhotos({
    query,
    page = 1,
    perPage = 24,
  }: {
    query?: string;
    page?: number;
    perPage?: number;
  }): Promise<UnsplashSearchResult> {
    const logger = this.loggerFactory("searchPhotos");
    const safePage = Math.max(1, page);
    const safePerPage = Math.min(30, Math.max(1, perPage));
    const normalizedQuery = (query ?? "").trim();
    const key = this.cacheKey(normalizedQuery, safePage, safePerPage);

    logger.debug(
      { query: normalizedQuery, page: safePage, perPage: safePerPage },
      "Searching Unsplash",
    );

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        logger.debug({ key }, "Unsplash cache hit");
        return JSON.parse(cached) as UnsplashSearchResult;
      }
    } catch (error) {
      logger.warn({ error, key }, "Redis lookup failed for Unsplash cache");
    }

    let items: UnsplashPhoto[];
    let total: number;

    if (normalizedQuery) {
      const response = await this.fetchFromUnsplash("/search/photos", {
        query: normalizedQuery,
        page: String(safePage),
        per_page: String(safePerPage),
      });

      if (!response.ok) {
        const body = await response.text();
        logger.error(
          { status: response.status, body },
          "Unsplash search failed",
        );
        throw new Error(
          `Unsplash search failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as UnsplashSearchApiResponse;
      items = data.results.map((photo) => this.mapPhoto(photo));
      total = data.total;
    } else {
      const response = await this.fetchFromUnsplash("/photos", {
        page: String(safePage),
        per_page: String(safePerPage),
      });

      if (!response.ok) {
        const body = await response.text();
        logger.error(
          { status: response.status, body },
          "Unsplash editorial list failed",
        );
        throw new Error(
          `Unsplash editorial list failed with status ${response.status}`,
        );
      }

      const data = (await response.json()) as UnsplashApiPhoto[];
      items = data.map((photo) => this.mapPhoto(photo));
      // Editorial feed has no total; approximate for pagination.
      total =
        items.length < safePerPage
          ? (safePage - 1) * safePerPage + items.length
          : safePage * safePerPage + 1;
    }

    const result: UnsplashSearchResult = {
      items,
      total,
      page: safePage,
    };

    try {
      await this.redis.setex(key, CACHE_TTL_SECONDS, JSON.stringify(result));
      logger.debug({ key }, "Unsplash cache written");
    } catch (error) {
      logger.warn({ error, key }, "Failed to write Unsplash cache");
    }

    return result;
  }

  public isValidDownloadLocation(downloadLocation: string): boolean {
    try {
      const url = new URL(downloadLocation);
      return (
        url.protocol === "https:" &&
        url.hostname === "api.unsplash.com" &&
        url.pathname.startsWith("/photos/") &&
        url.pathname.includes("/download")
      );
    } catch {
      return false;
    }
  }

  public async trackDownload(downloadLocation: string): Promise<void> {
    const logger = this.loggerFactory("trackDownload");

    if (!this.isValidDownloadLocation(downloadLocation)) {
      logger.warn({ downloadLocation }, "Invalid Unsplash download location");
      throw new Error("Invalid Unsplash download location");
    }

    try {
      const response = await fetch(downloadLocation, {
        headers: {
          Authorization: `Client-ID ${this.getAccessKey()}`,
          "Accept-Version": "v1",
        },
      });

      if (!response.ok) {
        const body = await response.text();
        logger.warn(
          { status: response.status, body, downloadLocation },
          "Unsplash download tracking failed",
        );
        return;
      }

      logger.debug({ downloadLocation }, "Unsplash download tracked");
    } catch (error) {
      logger.warn(
        { error, downloadLocation },
        "Unsplash download tracking error",
      );
    }
  }
}
