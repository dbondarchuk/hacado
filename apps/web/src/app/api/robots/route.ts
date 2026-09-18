import { collectSiteBodies } from "@/utils/page-metadata";
import { getServicesContainer, getWebsiteUrl } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const logger = getLoggerFactory("API/robots")("GET");
  const url = await getWebsiteUrl();
  logger.debug(
    {
      url: req.url,
      method: req.method,
    },
    "Processing robots.txt request",
  );

  const siteBodies = await collectSiteBodies(url);
  const hasLlmsTxt = siteBodies.has("llms.txt");

  let hasLlmsFull = false;
  if (hasLlmsTxt) {
    const servicesContainer = await getServicesContainer();
    const fullProviders =
      await servicesContainer.connectedAppsService.getAppsByScope(
        "llms-full-txt-provider",
      );

    hasLlmsFull = fullProviders.some((app) => app.status === "connected");
  }

  const llmComments =
    hasLlmsTxt || hasLlmsFull
      ? [
          "",
          "# LLM discovery",
          ...(hasLlmsTxt ? [`# ${url}/llms.txt`] : []),
          ...(hasLlmsFull ? [`# ${url}/llms-full.txt`] : []),
        ].join("\n")
      : "";

  const robots = `User-Agent: *
Allow: /
Disallow: /admin/

Sitemap: ${url}/sitemap.xml${llmComments}`;

  logger.debug(
    {
      sitemapUrl: `${url}/sitemap.xml`,
      hasLlmsTxt,
      hasLlmsFull,
    },
    "Successfully generated robots.txt",
  );

  return new Response(robots, {
    headers: { "Content-Type": "text/plain" },
  });
}

export const dynamic = "force-dynamic";
