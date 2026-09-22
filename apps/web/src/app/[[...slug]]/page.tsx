import { AppScriptRenderer } from "@/components/app-script-renderer";
import {
  collectPageFooterScripts,
  collectPageHeaderScripts,
} from "@/utils/app-scripts";
import {
  collectAppPageMetadata,
  mergeBaseAndAppMetadata,
} from "@/utils/page-metadata";
import { collectPageSeoArgs, resolvePageSeoFields } from "@/utils/page-seo";
import { buildSiteIconsMetadata } from "@/utils/site-icons";
import {
  getOrganizationId,
  getServicesContainer,
  getWebsiteUrl,
} from "@/utils/utils";
import { AppsBlocksReaders } from "@hacado/app-store/blocks/readers";
import { PublicPageRenderers } from "@hacado/app-store/public-page-renderers";
import { getLoggerFactory } from "@hacado/logger";
import { ReplaceOriginalColors } from "@hacado/page-builder-base/reader";
import {
  BlockProviderRegistry,
  Header,
  PageReader,
  Styling,
} from "@hacado/page-builder/reader";
import type {
  ConnectedAppData,
  IPublicPageProvider,
  PublicPageChrome,
  PublicPageClaim,
} from "@hacado/types";
import { formatArguments, setPageData } from "@hacado/utils";
import { DateTime } from "luxon";
import { Metadata, ResolvingMetadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache, ReactNode } from "react";

type Props = PageProps<"/[[...slug]]">;

export const dynamicParams = true;
export const revalidate = 60;

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

type PublicPageMatch = {
  app: ConnectedAppData;
  claim: PublicPageClaim;
  chrome?: PublicPageChrome;
};

const resolvePublicPageTakeover = cache(
  async (
    slugPath: string,
    searchParams: Record<string, string | string[] | undefined>,
    websiteUrl: string,
  ): Promise<PublicPageMatch | null> => {
    if (!slugPath || slugPath.includes("/")) {
      return null;
    }

    const servicesContainer = await getServicesContainer();
    const apps =
      await servicesContainer.connectedAppsService.getAppsByScopeWithData(
        "public-page-provider",
      );

    for (const app of apps) {
      const { service: provider } =
        await servicesContainer.connectedAppsService.getAppService<IPublicPageProvider>(
          app._id,
        );

      if (!provider.getPublicPageClaims) {
        continue;
      }

      const claims = await provider.getPublicPageClaims(app);
      const claim = claims.find((c) => c.slug === slugPath);
      if (!claim) {
        continue;
      }

      const chrome = provider.getPublicPageChrome
        ? await provider.getPublicPageChrome(app, {
            slug: slugPath,
            searchParams,
            websiteUrl,
          })
        : undefined;

      return { app, claim, chrome };
    }

    return null;
  },
);

const getSource = cache(async (slug?: string, preview = false) => {
  const logger = getLoggerFactory("PageComponent")("getSource");

  if (slug?.startsWith("_next/")) {
    logger.warn({ slug }, "Skipping _next/ route");
    throw new NotFoundError("Cannot access _next/ route");
  }

  const organizationId = await getOrganizationId();
  if (!organizationId) {
    logger.warn(
      "No organization ID found, redirecting to organization not found",
    );

    redirect("/organization-not-found");
  }

  const servicesContainer = await getServicesContainer();

  logger.debug({ slug, preview }, "Getting page source");

  if (!slug || !slug.length) {
    logger.debug(
      { originalSlug: slug },
      "No slug provided, defaulting to home",
    );
    slug = "home";
  }

  logger.debug({ slug, preview }, "Retrieving page by slug");

  const result = await servicesContainer.pagesService.resolvePage(slug);
  if (!result) {
    logger.warn({ slug }, "Page not found, returning 404");
    throw new NotFoundError("Page not found");
  }

  const { page, params } = result;

  if (slug.length === 1 && slug[0] === "home" && !page) {
    logger.info({ slug }, "Home page not found, redirecting to install");
    redirect("/install");
  }

  if (!page) {
    const headersList = await headers();
    const ua = headersList.get("user-agent");
    logger.warn({ slug, ua }, "Page not found, returning 404");
    throw new NotFoundError("Page not found");
  }

  if (!preview && (!page.published || page.publishDate > new Date())) {
    logger.warn(
      {
        slug,
        preview,
        pageExists: !!page,
        pagePublished: page?.published,
        publishDate: page?.publishDate,
        currentDate: new Date().toISOString(),
      },
      "Page not found or not published",
    );
    throw new NotFoundError("Page not found");
  }

  const { general, brand } =
    await servicesContainer.configurationService.getConfigurations(
      "general",
      "brand",
    );

  logger.debug(
    {
      slug,
      pageId: page._id,
      pageTitle: page.title,
      pagePublished: page.published,
      publishDate: page.publishDate,
    },
    "Successfully retrieved page source",
  );

  return { page, general, brand, params };
});

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const logger = getLoggerFactory("PageComponent")("generateMetadata");

  logger.debug({ hasParent: !!parent }, "Generating page metadata");

  try {
    const searchParams = await props.searchParams;
    const params = await props.params;
    const slugPath = params.slug?.join("/") || "home";
    const websiteUrl = await getWebsiteUrl();

    const takeover = await resolvePublicPageTakeover(
      slugPath,
      searchParams || {},
      websiteUrl,
    );

    if (takeover) {
      const title =
        takeover.chrome?.title ||
        takeover.claim.slug.charAt(0).toUpperCase() +
          takeover.claim.slug.slice(1);

      return {
        title,
        robots: takeover.claim.noIndex
          ? { index: false, follow: false }
          : undefined,
      };
    }

    logger.debug(
      {
        slug: params.slug,
        preview: searchParams?.preview,
      },
      "Processing metadata generation request",
    );

    const {
      page,
      brand,
      params: routeParams,
    } = await getSource(params.slug?.join("/"), !!searchParams?.preview);

    logger.debug(
      {
        siteTitle: brand.title,
        siteDescription: brand.description?.substring(0, 100) + "...",
      },
      "Retrieved general configuration",
    );

    const seoArgs = await collectPageSeoArgs(page, routeParams);
    const { title, description, keywords, featuredImage } =
      resolvePageSeoFields(page, brand, seoArgs, websiteUrl);

    const ogImageUrl =
      featuredImage || `${websiteUrl.replace(/\/$/, "")}/api/og/${slugPath}`;
    const appMetadataParts = await collectAppPageMetadata(
      websiteUrl,
      page,
      routeParams,
    );

    logger.debug(
      {
        pageId: page._id,
        pageTitle: page.title,
        generatedTitle: title,
        doNotCombineTitle: page.doNotCombine?.title,
        doNotCombineDescription: page.doNotCombine?.description,
        doNotCombineKeywords: page.doNotCombine?.keywords,
        ogImageUrl,
        appMetadataCount: appMetadataParts.length,
      },
      "Generated page metadata",
    );

    return mergeBaseAndAppMetadata(
      {
        title,
        description,
        keywords,
        icons: await buildSiteIconsMetadata(),
        openGraph: {
          title,
          description,
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [ogImageUrl],
        },
      },
      appMetadataParts,
    );
  } catch (error: any) {
    const loggerFn =
      error instanceof NotFoundError ? logger.warn : logger.error;

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage === "NEXT_REDIRECT") {
      return {
        title: "Error",
        description: "An error occurred while loading the page",
      };
    }

    loggerFn(
      {
        slug: (await props.params).slug,
        error: errorMessage,
      },
      "Error generating page metadata",
    );

    return {
      title: "Error",
      description: "An error occurred while loading the page",
    };
  }
}

async function renderPublicPageTakeover(args: {
  match: PublicPageMatch;
  searchParams: Record<string, string | string[] | undefined>;
  websiteUrl: string;
  styling: any;
}): Promise<ReactNode> {
  const { match, searchParams, websiteUrl, styling } = args;
  const servicesContainer = await getServicesContainer();
  const { general, brand } =
    await servicesContainer.configurationService.getConfigurations(
      "general",
      "brand",
    );

  const header = match.chrome?.headerId
    ? await servicesContainer.pagesService.getPageHeader(match.chrome.headerId)
    : undefined;
  const footer = match.chrome?.footerId
    ? await servicesContainer.pagesService.getPageFooter(match.chrome.footerId)
    : undefined;

  const apps =
    await servicesContainer.connectedAppsService.getAppsByScope(
      "ui-components",
    );

  const blockRegistry: BlockProviderRegistry = {
    providers:
      apps?.map((app) => ({
        providerName: app.name,
        priority: 100,
        blocks: Object.fromEntries(
          Object.entries(AppsBlocksReaders[app.name] || {}).map(
            ([name, value]) => [
              name,
              {
                reader: value,
              },
            ],
          ),
        ),
      })) || [],
  };

  const Renderer =
    PublicPageRenderers[match.app.name]?.[match.claim.slug] || null;

  if (!Renderer) {
    throw new NotFoundError("Public page renderer not found");
  }

  return (
    <>
      <Styling styling={styling} />
      <ReplaceOriginalColors />
      {header && (
        <Header name={general.name} logo={brand.logo} config={header} />
      )}
      {Renderer({
        appId: match.app._id,
        appName: match.app.name,
        searchParams,
        websiteUrl,
      })}
      {footer?.content && (
        <PageReader
          document={footer.content}
          args={formatArguments(
            {
              general,
              brand,
              now: new Date(),
              path: match.claim.slug,
              searchParams,
            },
            brand.language,
            general.currency,
            general.country,
          )}
          blockRegistry={blockRegistry}
        />
      )}
    </>
  );
}

export default async function Page(props: Props) {
  const logger = getLoggerFactory("PageComponent")("Page");

  logger.debug({ hasProps: !!props }, "Rendering page component");
  const start = performance.now();

  try {
    const searchParams = await props.searchParams;
    const routeParams = await props.params;
    const slugPath = routeParams.slug?.join("/") || "home";
    const websiteUrl = await getWebsiteUrl();

    const servicesContainer = await getServicesContainer();
    const { styling, social } =
      await servicesContainer.configurationService.getConfigurations(
        "styling",
        "social",
      );

    const takeover = await resolvePublicPageTakeover(
      slugPath,
      searchParams || {},
      websiteUrl,
    );

    if (takeover) {
      logger.info(
        {
          slug: slugPath,
          appId: takeover.app._id,
          appName: takeover.app.name,
        },
        "Rendering public page takeover",
      );

      return renderPublicPageTakeover({
        match: takeover,
        searchParams: searchParams || {},
        websiteUrl,
        styling,
      });
    }

    logger.debug(
      {
        slug: routeParams.slug,
        preview: searchParams?.preview,
        slugLength: routeParams.slug?.length,
      },
      "Processing page render request",
    );

    const { page, general, brand, params } = await getSource(
      routeParams.slug?.join("/"),
      !!searchParams?.preview,
    );

    const [pageHeaderScripts, pageFooterScripts] = await Promise.all([
      collectPageHeaderScripts(websiteUrl, page, params),
      collectPageFooterScripts(websiteUrl, page, params),
    ]);

    logger.debug(
      {
        pageId: page._id,
        pageTitle: page.title,
        pageFullWidth: page.fullWidth,
        contentLength: page.content?.length || 0,
      },
      "Setting page data and rendering content",
    );

    setPageData({
      routeParams,
      searchParams: searchParams || {},
      page,
      params,
    });

    logger.info(
      {
        pageId: page._id,
        pageTitle: page.title,
        pageSlug: slugPath,
        preview: searchParams?.preview,
      },
      "Successfully rendered page",
    );

    const { content, ...rest } = page;
    const args: Record<string, any> = {
      page: rest,
      isPage: true,
      general: general,
      brand: brand,
      social: social,
      now: new Date(),
      path: routeParams.slug?.join("/") || "",
      params,
      searchParams: searchParams || {},
      ...rest,
    };

    const cookieStore = await cookies();
    const appointmentId = cookieStore.get("appointment_id")?.value;
    if (appointmentId) {
      const appointment =
        await servicesContainer.bookingService.getAppointment(appointmentId);
      if (
        appointment &&
        DateTime.fromJSDate(appointment.createdAt).diffNow().toMillis() <
          60 * 1000 // 60 seconds
      ) {
        args.appointment = appointment;
      } else {
        notFound();
      }
    }

    const header = page.headerId
      ? await servicesContainer.pagesService.getPageHeader(page.headerId)
      : undefined;

    const footer = page.footerId
      ? await servicesContainer.pagesService.getPageFooter(page.footerId)
      : undefined;

    const formattedArgs = formatArguments(
      args,
      rest.language || brand.language,
      general.currency,
      general.country,
    );

    const apps =
      await servicesContainer.connectedAppsService.getAppsByScope(
        "ui-components",
      );

    const isDev = process.env.NODE_ENV === "development";
    const hasNoAppBlocks =
      isDev && searchParams && "noAppBlocks" in searchParams;

    const blockRegistry: BlockProviderRegistry = {
      providers: hasNoAppBlocks
        ? []
        : apps?.map((app) => ({
            providerName: app.name,
            priority: 100,
            blocks: Object.fromEntries(
              Object.entries(AppsBlocksReaders[app.name] || {}).map(
                ([name, value]) => [
                  name,
                  {
                    reader: value,
                  },
                ],
              ),
            ),
          })) || [],
    };

    return (
      <>
        {pageHeaderScripts.map((script, index) => (
          <AppScriptRenderer
            script={script}
            id={`app-page-header-${index}`}
            key={script.id || `header-${index}`}
          />
        ))}
        <Styling styling={styling} />
        <ReplaceOriginalColors />
        {header && (
          <Header name={general.name} logo={brand.logo} config={header} />
        )}
        <PageReader
          document={content}
          args={formattedArgs}
          blockRegistry={blockRegistry}
        />
        {footer?.content && (
          <PageReader
            document={footer.content}
            args={formattedArgs}
            blockRegistry={blockRegistry}
          />
        )}
        {pageFooterScripts.map((script, index) => (
          <AppScriptRenderer
            script={script}
            id={`app-page-footer-${index}`}
            key={script.id || `footer-${index}`}
          />
        ))}
      </>
    );
  } catch (error: any) {
    const loggerFn =
      error instanceof NotFoundError ? logger.warn : logger.error;

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage !== "NEXT_REDIRECT") {
      loggerFn(
        {
          slug: (await props.params).slug,
          error: errorMessage,
        },
        "Error rendering page",
      );
    }

    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  } finally {
    logger.debug(
      { duration: `${performance.now() - start}ms` },
      "Page rendering completed",
    );
  }
}
