import {
  APPLE_ICON_SIZE,
  iconResponse,
  renderSiteIconPng,
  resolveSiteIconSource,
} from "@/utils/site-icons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const contentType = "image/png";

/**
 * Must not call headers()/cookies() — Next invokes this from generateStaticParams
 * at build time. Tenant-specific data is resolved in the AppleIcon handler instead.
 */
export function generateImageMetadata() {
  return [
    {
      id: String(APPLE_ICON_SIZE),
      size: { width: APPLE_ICON_SIZE, height: APPLE_ICON_SIZE },
      contentType: "image/png",
    },
  ];
}

export default async function AppleIcon({
  id,
}: {
  id: Promise<string | number>;
}) {
  await id;
  const source = await resolveSiteIconSource();
  const buffer = await renderSiteIconPng(APPLE_ICON_SIZE, source);

  return iconResponse(buffer, {
    contentType: "image/png",
    immutable: false,
    etag: `${source.organizationId}-${source.version}-${APPLE_ICON_SIZE}`,
  });
}
