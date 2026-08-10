import { collectPageSeoArgs, resolvePageSeoFields } from "@/utils/page-seo";
import {
  getOrganizationId,
  getServicesContainer,
  getWebsiteUrl,
} from "@/utils/utils";
import { AppsBlocksReaders } from "@hacado/app-store/blocks/readers";
import { getLoggerFactory } from "@hacado/logger";
import {
  BlockProviderRegistry,
  Header,
  PageReader,
  Styling,
} from "@hacado/page-builder/reader";
import { formatArguments, setPageData } from "@hacado/utils";
import { DateTime } from "luxon";
import { Metadata, ResolvingMetadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

type Props = PageProps<"/[[...slug]]">;

export const dynamicParams = true;
export const revalidate = 60;

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

const getSource = cache(async (slug?: string, preview = false) => {
  const logger = getLoggerFactory("PageComponent")("getSource");
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

  if (slug.startsWith("_next/")) {
    logger.warn({ slug }, "Skipping _next/ route");
    throw new NotFoundError("Cannot access _next/ route");
  }

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

  // read route params
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
    const websiteUrl = await getWebsiteUrl();
    const { title, description, keywords, featuredImage } =
      resolvePageSeoFields(page, brand, seoArgs, websiteUrl);

    const slugPath = params.slug?.join("/") || "home";
    const ogImageUrl =
      featuredImage || `${websiteUrl.replace(/\/$/, "")}/api/og/${slugPath}`;

    logger.debug(
      {
        pageId: page._id,
        pageTitle: page.title,
        generatedTitle: title,
        doNotCombineTitle: page.doNotCombine?.title,
        doNotCombineDescription: page.doNotCombine?.description,
        doNotCombineKeywords: page.doNotCombine?.keywords,
        ogImageUrl,
      },
      "Generated page metadata",
    );

    return {
      title,
      description,
      keywords,
      icons: {
        icon: brand.favicon || "/icon.ico",
      },
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
    };
  } catch (error: any) {
    const loggerFn =
      error instanceof NotFoundError ? logger.warn : logger.error;

    loggerFn(
      {
        slug: (await props.params).slug,
        error: error instanceof Error ? error.message : String(error),
      },
      "Error generating page metadata",
    );

    // Return basic metadata on error
    return {
      title: "Error",
      description: "An error occurred while loading the page",
    };
  }
}

export default async function Page(props: Props) {
  const logger = getLoggerFactory("PageComponent")("Page");

  logger.debug({ hasProps: !!props }, "Rendering page component");
  const start = performance.now();

  try {
    const searchParams = await props.searchParams;
    const routeParams = await props.params;

    const servicesContainer = await getServicesContainer();
    const { styling, social } =
      await servicesContainer.configurationService.getConfigurations(
        "styling",
        "social",
      );

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
        pageSlug: routeParams.slug?.join("/") || "home",
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
        <Styling styling={styling} />
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
      </>
    );
  } catch (error: any) {
    const loggerFn =
      error instanceof NotFoundError ? logger.warn : logger.error;

    loggerFn(
      {
        slug: (await props.params).slug,
        error: error instanceof Error ? error.message : String(error),
      },
      "Error rendering page",
    );

    if (error instanceof NotFoundError) {
      notFound();
    }

    // Re-throw to let Next.js handle the error
    throw error;
  } finally {
    logger.debug(
      { duration: `${performance.now() - start}ms` },
      "Page rendering completed",
    );
  }
}
