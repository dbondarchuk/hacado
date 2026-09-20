import { getOrganizationId, getServicesContainer } from "@/utils/utils";
import {
  isSvgFaviconSource,
  parseSvgViewBoxSize,
  stream2buffer,
  validateFaviconDimensions,
} from "@hacado/utils";
import { createHash } from "crypto";
import type { Metadata } from "next";
import sharp from "sharp";

export const ICON_PNG_SIZES = [16, 32, 48, 192, 512] as const;
export type IconPngSize = (typeof ICON_PNG_SIZES)[number];

export const APPLE_ICON_SIZE = 180;
export const FAVICON_ICO_SIZE = 48;

const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
const SHORT_CACHE = "public, max-age=3600, must-revalidate";

export type SiteIconSource = {
  organizationId: string;
  version: string;
  title: string;
  buffer: Buffer | null;
  isSvg: boolean;
  mimeType?: string;
};

function assetPathFromFavicon(favicon: string): string | null {
  if (favicon.startsWith("/assets/")) {
    return favicon.slice("/assets/".length);
  }

  try {
    const url = new URL(favicon);
    const marker = "/assets/";
    const index = url.pathname.indexOf(marker);
    if (index >= 0) {
      return decodeURIComponent(url.pathname.slice(index + marker.length));
    }
  } catch {
    // not an absolute URL
  }

  return null;
}

async function loadFaviconBuffer(
  favicon: string,
): Promise<{ buffer: Buffer; mimeType?: string; hash?: string } | null> {
  const servicesContainer = await getServicesContainer();
  const assetPath = assetPathFromFavicon(favicon);

  if (assetPath) {
    const result = await servicesContainer.assetsService.streamAsset(assetPath);
    if (!result) {
      return null;
    }

    const buffer = await stream2buffer(result.stream);
    return {
      buffer,
      mimeType: result.asset.mimeType,
      hash: result.asset.hash,
    };
  }

  if (!/^https?:\/\//i.test(favicon)) {
    return null;
  }

  const response = await fetch(favicon, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: response.headers.get("content-type") || undefined,
  };
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

async function isValidFaviconBuffer(
  buffer: Buffer,
  mimeType?: string,
  faviconUrl?: string,
): Promise<{ ok: true; isSvg: boolean } | { ok: false }> {
  const isSvg = isSvgFaviconSource({
    url: faviconUrl,
    mimeType,
  });

  if (isSvg) {
    const svgText = buffer.toString("utf8");
    const viewBox = parseSvgViewBoxSize(svgText);
    const validation = validateFaviconDimensions({
      width: viewBox?.width,
      height: viewBox?.height,
      isSvg: true,
    });
    return validation.ok ? { ok: true, isSvg: true } : { ok: false };
  }

  try {
    const metadata = await sharp(buffer).metadata();
    const validation = validateFaviconDimensions({
      width: metadata.width,
      height: metadata.height,
      isSvg: false,
    });
    return validation.ok ? { ok: true, isSvg: false } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function resolveSiteIconSource(): Promise<SiteIconSource> {
  const organizationId = (await getOrganizationId()) || "unknown";

  try {
    const servicesContainer = await getServicesContainer();
    const brand =
      await servicesContainer.configurationService.getConfiguration("brand");
    const title = brand?.title?.trim() || "H";
    const favicon = brand?.favicon?.trim();

    if (!favicon) {
      return {
        organizationId,
        version: "fallback",
        title,
        buffer: null,
        isSvg: false,
      };
    }

    const loaded = await loadFaviconBuffer(favicon);
    if (!loaded) {
      return {
        organizationId,
        version: "fallback",
        title,
        buffer: null,
        isSvg: false,
      };
    }

    const valid = await isValidFaviconBuffer(
      loaded.buffer,
      loaded.mimeType,
      favicon,
    );
    if (!valid.ok) {
      return {
        organizationId,
        version: "fallback",
        title,
        buffer: null,
        isSvg: false,
      };
    }

    const version =
      loaded.hash?.slice(0, 16) ||
      hashValue(favicon + String(loaded.buffer.length));

    return {
      organizationId,
      version,
      title,
      buffer: loaded.buffer,
      isSvg: valid.isSvg,
      mimeType: loaded.mimeType,
    };
  } catch {
    return {
      organizationId,
      version: "fallback",
      title: "H",
      buffer: null,
      isSvg: false,
    };
  }
}

function fallbackLetter(title: string) {
  const letter = title.trim().charAt(0).toUpperCase();
  return letter || "H";
}

async function renderFallbackPng(size: number, title: string): Promise<Buffer> {
  const letter = fallbackLetter(title);
  const fontSize = Math.round(size * 0.55);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="#111827"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#ffffff">${letter}</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function renderSiteIconPng(
  size: number,
  source: SiteIconSource,
): Promise<Buffer> {
  if (!source.buffer) {
    return renderFallbackPng(size, source.title);
  }

  try {
    return await sharp(source.buffer)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  } catch {
    return renderFallbackPng(size, source.title);
  }
}

export function siteIconMetadataId(
  organizationId: string,
  version: string,
  size: number,
) {
  return `${organizationId}-${version}-${size}`;
}

export function parseSizeFromIconId(id: string): number | null {
  if (/^\d+$/.test(id)) {
    const size = Number(id);
    return Number.isFinite(size) && size > 0 ? size : null;
  }

  const match = id.match(/-(\d+)$/);
  if (!match) {
    return null;
  }

  const size = Number(match[1]);
  return Number.isFinite(size) && size > 0 ? size : null;
}

/** Request-time icon link tags with `?v=` for cache busting (safe to call headers()). */
export async function buildSiteIconsMetadata(): Promise<Metadata["icons"]> {
  const source = await resolveSiteIconSource();
  const v = encodeURIComponent(source.version);

  return {
    icon: ICON_PNG_SIZES.map((size) => ({
      url: `/icon/${size}?v=${v}`,
      sizes: `${size}x${size}`,
      type: "image/png",
    })),
    apple: [
      {
        url: `/apple-icon/${APPLE_ICON_SIZE}?v=${v}`,
        sizes: `${APPLE_ICON_SIZE}x${APPLE_ICON_SIZE}`,
        type: "image/png",
      },
    ],
  };
}

export function iconResponse(
  buffer: Buffer,
  options: {
    contentType: string;
    immutable?: boolean;
    etag?: string;
  },
) {
  const headers = new Headers({
    "Content-Type": options.contentType,
    "Cache-Control": options.immutable ? IMMUTABLE_CACHE : SHORT_CACHE,
    "Content-Length": String(buffer.length),
  });

  if (options.etag) {
    headers.set("ETag", `"${options.etag}"`);
  }

  return new Response(new Uint8Array(buffer), { status: 200, headers });
}
