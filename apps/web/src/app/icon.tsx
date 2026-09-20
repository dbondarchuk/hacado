import {
  ICON_PNG_SIZES,
  iconResponse,
  parseSizeFromIconId,
  renderSiteIconPng,
  resolveSiteIconSource,
} from "@/utils/site-icons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const contentType = "image/png";

/**
 * Must not call headers()/cookies() — Next invokes this from generateStaticParams
 * at build time. Tenant-specific data is resolved in the Icon handler instead.
 * Cache busting uses ETag + short Cache-Control on the response.
 */
export function generateImageMetadata() {
  return ICON_PNG_SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const resolvedId = String(await id);
  const source = await resolveSiteIconSource();
  const size = parseSizeFromIconId(resolvedId) ?? 48;
  const buffer = await renderSiteIconPng(size, source);

  return iconResponse(buffer, {
    contentType: "image/png",
    immutable: false,
    etag: `${source.organizationId}-${source.version}-${size}`,
  });
}
