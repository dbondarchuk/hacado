import { getServicesContainer, getWebsiteUrl } from "@/utils/utils";
import { AvailableAppServices } from "@hacado/app-store/services";
import { getLoggerFactory } from "@hacado/logger";
import type { ISitemapItemsProvider, SitemapUrlEntry } from "@hacado/types";
import { pageSlugHasPlaceholder } from "@hacado/types";
import { NextRequest } from "next/server";

const SITEMAP_ITEMS_PROVIDER_SCOPE = "sitemap-items-provider" as const;

function getSitemapProviderService(
  service: unknown,
): ISitemapItemsProvider | null {
  if (!service || typeof service !== "object") return null;
  const s = service as Partial<ISitemapItemsProvider>;
  if (
    typeof s.provideSitemapUrls !== "function" &&
    typeof s.expandPlaceholderPageSitemapItems !== "function"
  ) {
    return null;
  }
  return s as ISitemapItemsProvider;
}

function generateSiteMap(pages: SitemapUrlEntry[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${pages
       .map(({ url, lastModified, priority }) => {
         return `
       <url>
           <loc>${url}</loc>
           <lastmod>${lastModified.toISOString()}</lastmod>
           <priority>${priority}</priority>
       </url>
     `;
       })
       .join("")}
   </urlset>
 `;
}

export async function GET(req: NextRequest) {
  const logger = getLoggerFactory("API/sitemap")("GET");

  logger.debug(
    {
      url: req.url,
      method: req.method,
    },
    "Processing sitemap.xml request",
  );

  const websiteUrl = await getWebsiteUrl();
  const servicesContainer = await getServicesContainer();

  const sitemapApps =
    await servicesContainer.connectedAppsService.getAppsByScopeWithData(
      SITEMAP_ITEMS_PROVIDER_SCOPE,
    );
  const connectedSitemapApps = sitemapApps.filter(
    (a) => a.status === "connected",
  );

  const providerEntries: SitemapUrlEntry[] = [];

  for (const appData of connectedSitemapApps) {
    const factory = AvailableAppServices[appData.name];
    if (!factory) continue;
    const service = factory(
      servicesContainer.connectedAppsService.getAppServiceProps(appData._id),
    );
    const provider = getSitemapProviderService(service);
    if (provider?.provideSitemapUrls) {
      const urls = await provider.provideSitemapUrls(appData, websiteUrl);
      if (urls?.length) providerEntries.push(...urls);
    }
  }

  const pages = await servicesContainer.pagesService.getPages({
    publishStatus: [true],
  });

  const pageEntries: SitemapUrlEntry[] = [];

  for (const page of pages.items) {
    if (pageSlugHasPlaceholder(page.slug)) {
      const fullPage = await servicesContainer.pagesService.getPage(page._id);
      if (!fullPage) continue;

      const expanded: SitemapUrlEntry[] = [];
      for (const appData of connectedSitemapApps) {
        const factory = AvailableAppServices[appData.name];
        if (!factory) continue;
        const service = factory(
          servicesContainer.connectedAppsService.getAppServiceProps(
            appData._id,
          ),
        );
        const provider = getSitemapProviderService(service);
        if (!provider?.expandPlaceholderPageSitemapItems) continue;
        const part = await provider.expandPlaceholderPageSitemapItems(
          appData,
          websiteUrl,
          fullPage,
        );

        if (part?.length) expanded.push(...part);
      }
      if (expanded.length > 0) pageEntries.push(...expanded);
    } else {
      pageEntries.push({
        url: `${websiteUrl}/${page.slug}`,
        lastModified: page.updatedAt,
        priority: 0.8,
      });
    }
  }

  const sitemap: SitemapUrlEntry[] = [
    {
      url: websiteUrl,
      lastModified: new Date(),
      priority: 1,
    },
    ...providerEntries,
    ...pageEntries,
  ];

  logger.debug(
    {
      baseUrl: websiteUrl,
      pageCount: pages.items.length,
      providerUrlCount: providerEntries.length,
      pageUrlCount: pageEntries.length,
      totalUrls: sitemap.length,
    },
    "Successfully generated sitemap",
  );

  return new Response(generateSiteMap(sitemap), {
    headers: { "Content-Type": "text/xml" },
  });
}

export const dynamic = "force-dynamic";
