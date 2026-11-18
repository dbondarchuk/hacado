import type { PexelsSearchResult } from "@hacado/types/pexels";
import type {
  StockMediaProviderName,
  StockMediaType,
} from "@hacado/types/stock-media";
import type { UnsplashSearchResult } from "@hacado/types/unsplash";
import { fetchAdminApi } from "./utils";

export type StockMediaSearchParams = {
  /** Defaults to unsplash. */
  provider?: StockMediaProviderName;
  /** Defaults to photo. */
  type?: StockMediaType;
  query?: string;
  page?: number;
  limit?: number;
};

export type StockMediaTrackDownloadParams = {
  /** Defaults to unsplash. */
  provider?: StockMediaProviderName;
  downloadLocation: string;
};

export async function search(
  searchParams: StockMediaSearchParams & {
    provider?: "unsplash";
    type?: "photo";
  },
): Promise<UnsplashSearchResult>;
export async function search(
  searchParams: StockMediaSearchParams & {
    provider: "pexels";
    type?: StockMediaType;
  },
): Promise<PexelsSearchResult>;
export async function search(
  searchParams: StockMediaSearchParams = {},
): Promise<UnsplashSearchResult | PexelsSearchResult> {
  const params = new URLSearchParams();
  const provider = searchParams.provider ?? "unsplash";
  const type = searchParams.type ?? "photo";

  params.set("provider", provider);
  params.set("type", type);

  if (searchParams.query) {
    params.set("query", searchParams.query);
  }

  if (searchParams.page != null) {
    params.set("page", String(searchParams.page));
  }

  if (searchParams.limit != null) {
    params.set("limit", String(searchParams.limit));
  }

  const qs = params.toString();
  const response = await fetchAdminApi(
    `/stock-media/search${qs ? `?${qs}` : ""}`,
    { method: "GET" },
  );

  return response.json<UnsplashSearchResult | PexelsSearchResult>();
}

export const trackDownload = async (
  params: StockMediaTrackDownloadParams,
): Promise<{ ok: true }> => {
  const response = await fetchAdminApi("/stock-media/download", {
    method: "POST",
    body: JSON.stringify({
      provider: params.provider ?? "unsplash",
      downloadLocation: params.downloadLocation,
    }),
  });

  return response.json<{ ok: true }>();
};
