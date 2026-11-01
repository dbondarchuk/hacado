import { fetchClientApi } from "./utils";

type CallAppApiParams = {
  appId: string;
  path: string;
  headers?: Record<string, string>;
} & (
  | {
      method?: "GET" | "DELETE";
    }
  | {
      method?: "POST" | "PUT" | "PATCH";
      body?: any | FormData;
    }
);

export async function callAppApi<TResponse extends any = any>(
  params: CallAppApiParams & { parse?: "json" },
): Promise<TResponse>;
export async function callAppApi(
  params: CallAppApiParams & { parse: "text" },
): Promise<string>;
export async function callAppApi<TResponse extends any = any>(
  params: CallAppApiParams & { parse?: "json" | "text" },
): Promise<TResponse | string> {
  const { appId, path, method = "GET", headers, parse = "json" } = params;

  console.debug("Calling app API", {
    appId,
    path,
    method,
    headers,
  });

  const bodyToSend =
    "body" in params
      ? params.body instanceof FormData
        ? params.body
        : JSON.stringify(params.body)
      : undefined;

  const response = await fetchClientApi(`/apps/${appId}/${path}`, {
    method,
    body: bodyToSend,
    headers,
  });

  const data =
    parse === "json" ? await response.json<TResponse>() : await response.text();

  console.debug("App API called successfully", {
    appId,
    path,
    method,
  });

  return parse === "json" ? (data as TResponse) : data;
}
