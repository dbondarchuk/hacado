import {
  collectPageSeoArgs,
  resolvePageSeoFields,
  toAbsoluteWebsiteUrl,
} from "@/utils/page-seo";
import {
  getOrganizationId,
  getServicesContainer,
  getWebsiteUrl,
} from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const revalidate = 60;

const size = { width: 1200, height: 630 };

type RouteParams = { slug?: string[] };

export async function GET(
  _req: NextRequest,
  props: { params: Promise<RouteParams> },
) {
  const logger = getLoggerFactory("API/og")("GET");
  const params = await props.params;
  const slug = params.slug?.join("/") || "home";

  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return new Response("Organization not found", { status: 404 });
    }

    const servicesContainer = await getServicesContainer();
    const result = await servicesContainer.pagesService.resolvePage(slug);
    if (!result?.page) {
      return new Response("Page not found", { status: 404 });
    }

    const { page, params: routeParams } = result;
    if (!page.published || page.publishDate > new Date()) {
      return new Response("Page not found", { status: 404 });
    }

    const { brand } =
      await servicesContainer.configurationService.getConfigurations("brand");
    const seoArgs = await collectPageSeoArgs(page, routeParams);
    const websiteUrl = await getWebsiteUrl();
    const { pageTitle, featuredImage } = resolvePageSeoFields(
      page,
      brand,
      seoArgs,
      websiteUrl,
    );

    if (featuredImage) {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuredImage}
              alt=""
              width={size.width}
              height={size.height}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        ),
        size,
      );
    }

    const logoSrc = brand.logo
      ? toAbsoluteWebsiteUrl(websiteUrl, brand.logo)
      : undefined;
    const headline = pageTitle || brand.title || "Untitled";
    const brandName =
      brand.title && brand.title !== headline ? brand.title : undefined;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: 80,
            background: "#ffffff",
            color: "#111111",
          }}
        >
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt=""
              height={96}
              style={{
                height: 96,
                maxWidth: 480,
                objectFit: "contain",
              }}
            />
          ) : null}
          <div
            style={{
              display: "flex",
              marginTop: logoSrc ? 40 : 0,
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: "100%",
            }}
          >
            {headline}
          </div>
          {brandName ? (
            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 36,
                fontWeight: 500,
                color: "#525252",
                lineHeight: 1.3,
                maxWidth: "100%",
              }}
            >
              {brandName}
            </div>
          ) : null}
        </div>
      ),
      size,
    );
  } catch (error) {
    logger.error(
      {
        slug,
        error: error instanceof Error ? error.message : String(error),
      },
      "Error generating OG image",
    );
    return new Response("Error generating image", { status: 500 });
  }
}
