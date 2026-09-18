import { collectSiteBodies } from "@/utils/page-metadata";
import { getWebsiteUrl } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const logger = getLoggerFactory("API/llms")("GET");
  logger.debug(
    {
      url: req.url,
      method: req.method,
    },
    "Processing llms.txt request",
  );

  const websiteUrl = await getWebsiteUrl();
  const bodies = await collectSiteBodies(websiteUrl);
  const body = bodies.get("llms.txt");
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
