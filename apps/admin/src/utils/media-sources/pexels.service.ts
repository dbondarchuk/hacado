import { getLoggerFactory } from "@hacado/logger";
import type { PexelsMedia, PexelsSearchResult } from "@hacado/types";
import type { Redis } from "ioredis";

const PEXELS_API_BASE = "https://api.pexels.com";
const CACHE_KEY_PREFIX = "pexels:search:";
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

type PexelsPhotoApi = {
  id: number;
  width: number;
  height: number;
  url: string;
  alt: string | null;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    tiny: string;
  };
};

type PexelsVideoFileApi = {
  id: number;
  quality: string;
  file_type: string;
  width: number | null;
  height: number | null;
  link: string;
};

type PexelsVideoApi = {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: PexelsVideoFileApi[];
};

type PexelsPhotosSearchResponse = {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhotoApi[];
};

type PexelsVideosSearchResponse = {
  total_results: number;
  page: number;
  per_page: number;
  videos: PexelsVideoApi[];
};

export class PexelsService {
  protected readonly loggerFactory = getLoggerFactory("PexelsService");
  private readonly redis: Redis;

  public constructor(redis: Redis) {
    this.redis = redis;
  }

  public isConfigured(): boolean {
    return Boolean(process.env.PEXELS_API_KEY);
  }

  private getAccessKey(): string {
    const key = process.env.PEXELS_API_KEY;
    if (!key) {
      throw new Error("PEXELS_API_KEY is not configured");
    }
    return key;
  }

  private cacheKey(
    mediaType: "photo" | "video",
    query: string,
    page: number,
    perPage: number,
  ): string {
    const normalized = query.trim().toLowerCase();
    return `${CACHE_KEY_PREFIX}${mediaType}:${normalized || "_curated"}:${page}:${perPage}`;
  }

  private async fetchFromPexels(
    path: string,
    params: Record<string, string>,
  ): Promise<Response> {
    const url = new URL(`${PEXELS_API_BASE}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return fetch(url.toString(), {
      headers: {
        Authorization: this.getAccessKey(),
      },
    });
  }

  private mapPhoto(photo: PexelsPhotoApi): PexelsMedia {
    return {
      id: String(photo.id),
      type: "photo",
      alt: photo.alt,
      width: photo.width,
      height: photo.height,
      previewUrl: photo.src.medium || photo.src.small,
      url: photo.src.large || photo.src.original,
      mimeType: "image/jpeg",
      photographer: {
        name: photo.photographer,
        profileUrl: photo.photographer_url,
      },
      pexelsUrl: photo.url,
    };
  }

  private pickVideoFile(
    files: PexelsVideoFileApi[],
  ): PexelsVideoFileApi | undefined {
    const mp4s = files.filter(
      (file) => file.file_type === "video/mp4" && !!file.link,
    );
    const candidates = mp4s.length > 0 ? mp4s : files.filter((f) => !!f.link);
    if (candidates.length === 0) return undefined;

    const sorted = [...candidates].sort(
      (a, b) => (b.width ?? 0) - (a.width ?? 0),
    );
    return (
      sorted.find(
        (file) => (file.width ?? 0) > 0 && (file.width ?? 0) <= 1920,
      ) ?? sorted[sorted.length - 1]
    );
  }

  private mapVideo(video: PexelsVideoApi): PexelsMedia | null {
    const file = this.pickVideoFile(video.video_files ?? []);
    if (!file) return null;

    return {
      id: String(video.id),
      type: "video",
      alt: null,
      width: video.width,
      height: video.height,
      previewUrl: video.image,
      url: file.link,
      mimeType: file.file_type || "video/mp4",
      photographer: {
        name: video.user.name,
        profileUrl: video.user.url,
      },
      pexelsUrl: video.url,
    };
  }

  public async searchPhotos({
    query,
    page = 1,
    perPage = 24,
  }: {
    query?: string;
    page?: number;
    perPage?: number;
  }): Promise<PexelsSearchResult> {
    const logger = this.loggerFactory("searchPhotos");
    const safePage = Math.max(1, page);
    const safePerPage = Math.min(80, Math.max(1, perPage));
    const normalizedQuery = (query ?? "").trim();
    const key = this.cacheKey("photo", normalizedQuery, safePage, safePerPage);

    logger.debug(
      { query: normalizedQuery, page: safePage, perPage: safePerPage },
      "Searching Pexels photos",
    );

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        logger.debug({ key }, "Pexels photo cache hit");
        return JSON.parse(cached) as PexelsSearchResult;
      }
    } catch (error) {
      logger.warn({ error, key }, "Redis lookup failed for Pexels cache");
    }

    const path = normalizedQuery ? "/v1/search" : "/v1/curated";
    const params: Record<string, string> = {
      page: String(safePage),
      per_page: String(safePerPage),
    };
    if (normalizedQuery) {
      params.query = normalizedQuery;
    }

    const response = await this.fetchFromPexels(path, params);
    if (!response.ok) {
      const body = await response.text();
      logger.error(
        { status: response.status, body },
        "Pexels photo search failed",
      );
      throw new Error(
        `Pexels photo search failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as PexelsPhotosSearchResponse;
    const result: PexelsSearchResult = {
      items: data.photos.map((photo) => this.mapPhoto(photo)),
      total: data.total_results,
      page: safePage,
    };

    try {
      await this.redis.setex(key, CACHE_TTL_SECONDS, JSON.stringify(result));
    } catch (error) {
      logger.warn({ error, key }, "Failed to write Pexels photo cache");
    }

    return result;
  }

  public async searchVideos({
    query,
    page = 1,
    perPage = 24,
  }: {
    query?: string;
    page?: number;
    perPage?: number;
  }): Promise<PexelsSearchResult> {
    const logger = this.loggerFactory("searchVideos");
    const safePage = Math.max(1, page);
    const safePerPage = Math.min(80, Math.max(1, perPage));
    const normalizedQuery = (query ?? "").trim();
    const key = this.cacheKey("video", normalizedQuery, safePage, safePerPage);

    logger.debug(
      { query: normalizedQuery, page: safePage, perPage: safePerPage },
      "Searching Pexels videos",
    );

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        logger.debug({ key }, "Pexels video cache hit");
        return JSON.parse(cached) as PexelsSearchResult;
      }
    } catch (error) {
      logger.warn({ error, key }, "Redis lookup failed for Pexels cache");
    }

    const path = normalizedQuery ? "/v1/videos/search" : "/v1/videos/popular";
    const params: Record<string, string> = {
      page: String(safePage),
      per_page: String(safePerPage),
    };
    if (normalizedQuery) {
      params.query = normalizedQuery;
    }

    const response = await this.fetchFromPexels(path, params);
    if (!response.ok) {
      const body = await response.text();
      logger.error(
        { status: response.status, body },
        "Pexels video search failed",
      );
      throw new Error(
        `Pexels video search failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as PexelsVideosSearchResponse;
    const items = data.videos
      .map((video) => this.mapVideo(video))
      .filter((item): item is PexelsMedia => item != null);

    const result: PexelsSearchResult = {
      items,
      total: data.total_results,
      page: safePage,
    };

    try {
      await this.redis.setex(key, CACHE_TTL_SECONDS, JSON.stringify(result));
    } catch (error) {
      logger.warn({ error, key }, "Failed to write Pexels video cache");
    }

    return result;
  }
}
