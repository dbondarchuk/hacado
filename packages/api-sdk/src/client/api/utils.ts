import { fetchWithJson } from "@hacado/utils";

export const BASE_CLIENT_API_URL = "/api";

export const fetchClientApi = async (url: string, options?: RequestInit) => {
  const fullUrl = `${BASE_CLIENT_API_URL}${url.startsWith("/") ? url : `/${url}`}`;
  const result = await fetchWithJson(fullUrl, options);

  if (!result.ok) {
    throw new ClientApiError(
      `Failed to fetch ${fullUrl}`,
      result.status,
      result,
    );
  }

  return result;
};

export class ClientApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response: Response,
  ) {
    super(message);
  }
}
