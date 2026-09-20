import type { IAssetsService } from "@hacado/types";
import {
  isSvgFaviconSource,
  parseSvgViewBoxSize,
  stream2buffer,
  validateFaviconDimensions,
  type FaviconValidationResult,
} from "@hacado/utils";
import sharp from "sharp";

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
  assetsService: IAssetsService,
): Promise<{ buffer: Buffer; mimeType?: string } | null> {
  const assetPath = assetPathFromFavicon(favicon);
  if (assetPath) {
    const result = await assetsService.streamAsset(assetPath);
    if (!result) {
      return null;
    }

    return {
      buffer: await stream2buffer(result.stream),
      mimeType: result.asset.mimeType,
    };
  }

  if (!/^https?:\/\//i.test(favicon)) {
    return null;
  }

  const response = await fetch(favicon, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    mimeType: response.headers.get("content-type") || undefined,
  };
}

export async function validateFaviconValue(
  favicon: string,
  assetsService: IAssetsService,
): Promise<FaviconValidationResult> {
  const loaded = await loadFaviconBuffer(favicon, assetsService);
  if (!loaded) {
    return { ok: false, code: "unreadable" };
  }

  const isSvg = isSvgFaviconSource({
    url: favicon,
    mimeType: loaded.mimeType,
  });

  if (isSvg) {
    const viewBox = parseSvgViewBoxSize(loaded.buffer.toString("utf8"));
    return validateFaviconDimensions({
      width: viewBox?.width,
      height: viewBox?.height,
      isSvg: true,
    });
  }

  try {
    const metadata = await sharp(loaded.buffer).metadata();
    return validateFaviconDimensions({
      width: metadata.width,
      height: metadata.height,
      isSvg: false,
    });
  } catch {
    return { ok: false, code: "unreadable" };
  }
}
