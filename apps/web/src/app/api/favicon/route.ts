import {
  FAVICON_ICO_SIZE,
  iconResponse,
  renderSiteIconPng,
  resolveSiteIconSource,
} from "@/utils/site-icons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const source = await resolveSiteIconSource();
  const buffer = await renderSiteIconPng(FAVICON_ICO_SIZE, source);

  return iconResponse(buffer, {
    contentType: "image/png",
    immutable: false,
    etag: `${source.organizationId}-${source.version}-${FAVICON_ICO_SIZE}`,
  });
}
