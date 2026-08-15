import { getWebsiteUrl } from "@/utils/utils";
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

  const robots = `User-Agent: *
Allow: /
Disallow: /admin/

Sitemap: ${url}/sitemap.xml`;

  logger.debug(
    {
      sitemapUrl: `${url}/sitemap.xml`,
    },
    "Successfully generated robots.txt",
  );

  return new Response(robots, {
    headers: { "Content-Type": "text/plain" },
  });
}

export const dynamic = "force-dynamic";
