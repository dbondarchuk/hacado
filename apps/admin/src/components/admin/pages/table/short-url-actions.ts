"use server";

import { getServicesContainer, getWebsiteUrl } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { isSmsLinkShorteningEnabled } from "@hacado/utils";

const loggerFactory = getLoggerFactory("PagesShortUrl");

export async function getShortPageUrl(
  pageSlug: string,
): Promise<{ ok: true; url: string } | { ok: false }> {
  const logger = loggerFactory("getShortPageUrl");
  if (!isSmsLinkShorteningEnabled()) {
    return { ok: false };
  }
  if (!pageSlug || pageSlug.includes("/") || pageSlug.includes("..")) {
    logger.warn({ pageSlug }, "Rejected invalid page slug for short url");
    return { ok: false };
  }

  try {
    const websiteUrl = await getWebsiteUrl();
    const absoluteUrl = `${websiteUrl}/${pageSlug}`;
    const services = await getServicesContainer();
    const url = await services.shortLinksService.shortenUrl(absoluteUrl);
    return { ok: true, url };
  } catch (error) {
    logger.error({ error, pageSlug }, "Failed to create short page url");
    return { ok: false };
  }
}
