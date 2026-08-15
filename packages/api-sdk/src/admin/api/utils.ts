import {
  fetchWithJson,
  responseWithJsonBody,
  type FetchWithJsonResponse,
} from "@hacado/utils";

export const BASE_ADMIN_API_URL = "/api";

/** Client-only GET cache TTL (server requests are never cached - avoids cross-request leakage). */
const ADMIN_API_GET_CACHE_TTL_MS = 5_000;

type GetCacheEntry = {
  expiresAt: number;
  bodyText: string;
  status: number;
  statusText: string;
};

const adminApiGetCache = new Map<string, GetCacheEntry>();
const adminApiGetInFlight = new Map<string, Promise<FetchWithJsonResponse>>();

function pruneStaleAdminApiCache() {
  const now = Date.now();
  for (const [key, entry] of adminApiGetCache) {
    if (entry.expiresAt <= now) {
      adminApiGetCache.delete(key);
    }
  }
}

function adminApiGetCacheKey(fullUrl: string) {
  return fullUrl;
}

export const fetchAdminApi = async (url: string, options?: RequestInit) => {
  const fullUrl = `${BASE_ADMIN_API_URL}${url.startsWith("/") ? url : `/${url}`}`;
  const method = (options?.method ?? "GET").toUpperCase();
  const useGetCache =
    typeof window !== "undefined" &&
    method === "GET" &&
    options?.cache !== "no-store";

  if (useGetCache) {
    const key = adminApiGetCacheKey(fullUrl);
    const cached = adminApiGetCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      const result = responseWithJsonBody(cached.bodyText, {
        status: cached.status,
        statusText: cached.statusText,
      });
      if (!result.ok) {
        throw new AdminApiError(
          `Failed to fetch ${fullUrl}`,
          result.status,
          result,
        );
      }
      return result;
    }

    const pending = adminApiGetInFlight.get(key);
    if (pending) {
      const result = await pending;
      if (!result.ok) {
        throw new AdminApiError(
          `Failed to fetch ${fullUrl}`,
          result.status,
          result,
        );
      }
      return result;
    }

    const promise = (async () => {
      const result = await fetchWithJson(fullUrl, options);
      if (!result.ok) {
        return result;
      }
      const bodyText = await result.clone().text();
      pruneStaleAdminApiCache();
      adminApiGetCache.set(key, {
        expiresAt: Date.now() + ADMIN_API_GET_CACHE_TTL_MS,
        bodyText,
        status: result.status,
        statusText: result.statusText,
      });
      // Replay from text so concurrent awaiters can each call `.json()` safely.
      return responseWithJsonBody(bodyText, {
        status: result.status,
        statusText: result.statusText,
      });
    })();

    adminApiGetInFlight.set(key, promise);
    try {
      const result = await promise;
      if (!result.ok) {
        throw new AdminApiError(
          `Failed to fetch ${fullUrl}`,
          result.status,
          result,
        );
      }
      return result;
    } finally {
      adminApiGetInFlight.delete(key);
    }
  }

  const result = await fetchWithJson(fullUrl, options);

  if (!result.ok) {
    throw new AdminApiError(
      `Failed to fetch ${fullUrl}`,
      result.status,
      result,
    );
  }

  return result;
};

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response: Response,
  ) {
    super(message);
  }
}
