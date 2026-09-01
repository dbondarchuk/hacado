import type { PexelsSearchResult } from "@hacado/types";
import { fetchAdminApi } from "./utils";

export type PexelsSearchParams = {
  query?: string;
  page?: number;
  limit?: number;
  type?: "photo" | "video";
};

export const searchPexelsMedia = async (
  searchParams: PexelsSearchParams = {},
): Promise<PexelsSearchResult> => {
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
  if (searchParams.type) {
    params.set("type", searchParams.type);
  }

  const qs = params.toString();
  const response = await fetchAdminApi(`/pexels/search${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });

  return response.json<PexelsSearchResult>();
};
