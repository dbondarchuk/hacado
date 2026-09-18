import { getServicesContainer, getWebsiteUrl } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import type { ILlmsFullTxtProvider } from "@hacado/types";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const logger = getLoggerFactory("API/llms-full")("GET");
  logger.debug(
    {
      url: req.url,
      method: req.method,
    },
    "Processing llms-full.txt request",
  );

  const websiteUrl = await getWebsiteUrl();
  const servicesContainer = await getServicesContainer();
  const parts = await servicesContainer.connectedAppsService.invokeAppsByScope<
    ILlmsFullTxtProvider,
    string | undefined
  >(
    "llms-full-txt-provider",
    async (appData, service) => {
      if (typeof service.provideLlmsFullTxt !== "function") {
        return undefined;
      }
      return service.provideLlmsFullTxt(appData, { websiteUrl });
    },
    { ignoreErrors: true },
  );

  const body = parts.filter(Boolean).join("\n");
  if (!body) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}

export const dynamic = "force-dynamic";
