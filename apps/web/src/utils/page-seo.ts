import { getServicesContainer } from "@/utils/utils";
import type {
  BrandConfiguration,
  IPageSeoArgumentsProvider,
  Page,
  PageSeoArguments,
} from "@hacado/types";
import { template } from "@hacado/utils";

export function seoArgString(
  seoArgs: PageSeoArguments,
  key: string,
): string | undefined {
  const value = seoArgs[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function toAbsoluteWebsiteUrl(
  websiteUrl: string,
  pathOrUrl: string,
): string {
  const trimmed = pathOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = websiteUrl.replace(/\/$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

export async function collectPageSeoArgs(
  page: Page,
  routeParams: Record<string, string>,
): Promise<PageSeoArguments> {
  const seoArgs: PageSeoArguments = { ...routeParams };

  if (Object.keys(routeParams).length === 0) {
    return seoArgs;
  }

  const servicesContainer = await getServicesContainer();
  const appArgs =
    await servicesContainer.connectedAppsService.invokeAppsByScope<
      IPageSeoArgumentsProvider,
      PageSeoArguments | undefined
    >(
      "page-seo-arguments-provider",
      async (appData, service) => {
        if (typeof service.providePageSeoArguments !== "function") {
          return undefined;
        }
        return service.providePageSeoArguments(appData, page, routeParams);
      },
      { ignoreErrors: true },
    );

  for (const part of appArgs) {
    if (part && typeof part === "object") {
      Object.assign(seoArgs, part);
    }
  }

  return seoArgs;
}

export function resolvePageSeoFields(
  page: Page,
  brand: BrandConfiguration,
  seoArgs: PageSeoArguments,
  websiteUrl: string,
) {
  const pageTitle = template(page.title, seoArgs, true);
  const pageDescription = template(page.description, seoArgs, true);
  const pageKeywords = template(page.keywords, seoArgs, true);

  const title = page.doNotCombine?.title
    ? pageTitle
    : [pageTitle, brand.title].filter((x) => !!x).join(" | ");

  const description = page.doNotCombine?.description
    ? pageDescription
    : [brand.description, pageDescription].filter((x) => !!x).join("\n");

  const keywords = page.doNotCombine?.keywords
    ? pageKeywords
    : [brand.keywords, pageKeywords].filter((x) => !!x).join(", ");

  const pageFeaturedImage = page.featuredImage?.trim();
  const featuredImage = pageFeaturedImage
    ? toAbsoluteWebsiteUrl(websiteUrl, pageFeaturedImage)
    : seoArgString(seoArgs, "featuredImage");

  return {
    pageTitle,
    pageDescription,
    pageKeywords,
    title,
    description,
    keywords,
    featuredImage,
  };
}
