export const FAVICON_MIN_SIZE = 512;

export const FAVICON_ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

export type FaviconConstraintErrorCode =
  | "not_square"
  | "too_small"
  | "unsupported_type"
  | "unreadable";

export type FaviconValidationResult =
  | { ok: true; isSvg: boolean }
  | { ok: false; code: FaviconConstraintErrorCode };

const RASTER_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export function isSvgFaviconSource(value: {
  url?: string | null;
  mimeType?: string | null;
  filename?: string | null;
}): boolean {
  const mime = value.mimeType?.toLowerCase();
  if (mime === "image/svg+xml" || mime === "image/svg") {
    return true;
  }

  const source = (value.url || value.filename || "").toLowerCase();
  return source.includes(".svg");
}

export function isAllowedFaviconMimeType(mimeType: string | null | undefined) {
  if (!mimeType) {
    return false;
  }

  const mime = mimeType.toLowerCase();
  return (
    mime === "image/svg+xml" ||
    mime === "image/svg" ||
    RASTER_MIME_TYPES.has(mime)
  );
}

export function validateFaviconDimensions(input: {
  width?: number | null;
  height?: number | null;
  isSvg: boolean;
}): FaviconValidationResult {
  if (input.isSvg) {
    if (
      typeof input.width === "number" &&
      typeof input.height === "number" &&
      input.width > 0 &&
      input.height > 0 &&
      input.width !== input.height
    ) {
      return { ok: false, code: "not_square" };
    }

    return { ok: true, isSvg: true };
  }

  if (
    typeof input.width !== "number" ||
    typeof input.height !== "number" ||
    !Number.isFinite(input.width) ||
    !Number.isFinite(input.height) ||
    input.width <= 0 ||
    input.height <= 0
  ) {
    return { ok: false, code: "unreadable" };
  }

  if (input.width !== input.height) {
    return { ok: false, code: "not_square" };
  }

  if (input.width < FAVICON_MIN_SIZE) {
    return { ok: false, code: "too_small" };
  }

  return { ok: true, isSvg: false };
}

export function parseSvgViewBoxSize(
  svgText: string,
): { width: number; height: number } | null {
  const viewBoxMatch = svgText.match(
    /viewBox\s*=\s*["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i,
  );

  if (viewBoxMatch) {
    const width = Number(viewBoxMatch[3]);
    const height = Number(viewBoxMatch[4]);
    if (
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width > 0 &&
      height > 0
    ) {
      return { width, height };
    }
  }

  const widthMatch = svgText.match(/\bwidth\s*=\s*["']?\s*([-\d.]+)/i);
  const heightMatch = svgText.match(/\bheight\s*=\s*["']?\s*([-\d.]+)/i);
  if (widthMatch && heightMatch) {
    const width = Number(widthMatch[1]);
    const height = Number(heightMatch[1]);
    if (
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width > 0 &&
      height > 0
    ) {
      return { width, height };
    }
  }

  return null;
}

export async function probeImageDimensions(
  url: string,
): Promise<{ width: number; height: number } | null> {
  if (typeof window === "undefined") {
    return null;
  }

  return await new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export async function validateFaviconUrlClient(
  url: string,
  options?: { mimeType?: string | null; filename?: string | null },
): Promise<FaviconValidationResult> {
  const isSvg = isSvgFaviconSource({
    url,
    mimeType: options?.mimeType,
    filename: options?.filename,
  });

  if (isSvg) {
    return { ok: true, isSvg: true };
  }

  const dimensions = await probeImageDimensions(url);
  if (!dimensions) {
    return { ok: false, code: "unreadable" };
  }

  return validateFaviconDimensions({
    ...dimensions,
    isSvg: false,
  });
}
