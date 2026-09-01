import type { UnsplashSearchResult } from "@hacado/types";
import { fetchAdminApi } from "./utils";

export type UnsplashSearchParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const searchUnsplashPhotos = async (
  searchParams: UnsplashSearchParams = {},
): Promise<UnsplashSearchResult> => {
  const params = new URLSearchParams();
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
    `/unsplash/search${qs ? `?${qs}` : ""}`,
    { method: "GET" },
  );

  return response.json<UnsplashSearchResult>();
};

export const trackUnsplashDownload = async (
  downloadLocation: string,
): Promise<{ ok: true }> => {
  const response = await fetchAdminApi("/unsplash/download", {
    method: "POST",
    body: JSON.stringify({ downloadLocation }),
  });

  return response.json<{ ok: true }>();
};
