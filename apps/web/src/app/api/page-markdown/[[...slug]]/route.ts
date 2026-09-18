import { collectPageBodies } from "@/utils/page-metadata";
import { getServicesContainer, getWebsiteUrl } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { pageSlugHasPlaceholder } from "@hacado/types";
import { NextRequest } from "next/server";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

export async function GET(req: NextRequest, props: Props) {
  const logger = getLoggerFactory("API/page-markdown")("GET");
  const params = await props.params;
  const slugPath = params.slug?.join("/") || "home";
  const slug = !slugPath || slugPath === "index" ? "home" : slugPath;

  logger.debug(
    {
      url: req.url,
      method: req.method,
      slugPath,
    },
    "Processing page markdown request",
  );

  if (pageSlugHasPlaceholder(slug)) {
    return new Response("Not Found", { status: 404 });
  }

  const servicesContainer = await getServicesContainer();
  const websiteUrl = await getWebsiteUrl();
  const result = await servicesContainer.pagesService.resolvePage(slug);
  const page = result?.page;
  if (!page) {
    return new Response("Not Found", { status: 404 });
  }

  const bodies = await collectPageBodies(websiteUrl, page, result.params || {});
  const body = bodies.get("text/markdown");
  if (!body) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}

export const dynamic = "force-dynamic";
