import { createHash } from "crypto";

export const SHORT_CODE_LENGTH = 8;
export const SHORT_CODE_ALPHABET =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const TRAILING_PUNCTUATION_PATTERN = /[.,;:!?)\]}]+$/;

function httpUrlPattern(): RegExp {
  return /https?:\/\/[^\s<>"']+/gi;
}

export function isSmsLinkShorteningEnabled(
  value = process.env.SMS_LINK_SHORTENING_ENABLED,
): boolean {
  if (!value) {
    return false;
  }
  return value === "true" || value === "1";
}

export function getShortDomain(
  shortDomain = process.env.SHORT_DOMAIN,
  publicDomain = process.env.PUBLIC_DOMAIN,
): string {
  return shortDomain || publicDomain || "haca.do";
}

export function getShortLinkBaseUrl(shortDomain = getShortDomain()): string {
  const schema = shortDomain.startsWith("localhost") ? "http" : "https";
  return `${schema}://${shortDomain}`;
}

export function buildShortLinkUrl(
  code: string,
  shortDomain = getShortDomain(),
): string {
  return `${getShortLinkBaseUrl(shortDomain)}/${code}`;
}

export function urlToShortCode(
  url: string,
  length = SHORT_CODE_LENGTH,
): string {
  const digest = createHash("sha256").update(url).digest();
  return encodeUnambiguous(digest, length);
}

export function isHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isShortLinkUrl(
  urlString: string,
  shortDomain = getShortDomain(),
): boolean {
  try {
    const url = new URL(urlString);
    const hostWithPort = url.port
      ? `${url.hostname}:${url.port}`
      : url.hostname;
    return hostWithPort === shortDomain;
  } catch {
    return false;
  }
}

export function stripTrailingUrlPunctuation(raw: string): {
  url: string;
  trailing: string;
} {
  const match = raw.match(TRAILING_PUNCTUATION_PATTERN);
  if (!match) {
    return { url: raw, trailing: "" };
  }
  return {
    url: raw.slice(0, -match[0].length),
    trailing: match[0],
  };
}

export type ExtractedHttpUrl = {
  raw: string;
  url: string;
  trailing: string;
};

export function extractHttpUrls(body: string): ExtractedHttpUrl[] {
  const matches = body.match(httpUrlPattern()) ?? [];
  return matches.map((raw) => {
    const { url, trailing } = stripTrailingUrlPunctuation(raw);
    return { raw, url, trailing };
  });
}

export type PlannedShortLink = {
  url: string;
  code: string;
};

export function collectUniqueUrlsToShorten(
  body: string,
  shortDomain = getShortDomain(),
): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const { url } of extractHttpUrls(body)) {
    if (!isHttpUrl(url) || isShortLinkUrl(url, shortDomain) || seen.has(url)) {
      continue;
    }
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

export function planSmsShortLinks(
  body: string,
  shortDomain = getShortDomain(),
  codeLength = SHORT_CODE_LENGTH,
): PlannedShortLink[] {
  return collectUniqueUrlsToShorten(body, shortDomain).map((url) => ({
    url,
    code: urlToShortCode(url, codeLength),
  }));
}

export function rewriteUrlsInText(
  body: string,
  shortUrlByOriginal: Map<string, string>,
  shortDomain = getShortDomain(),
): string {
  return body.replace(httpUrlPattern(), (raw) => {
    const { url, trailing } = stripTrailingUrlPunctuation(raw);
    if (!isHttpUrl(url) || isShortLinkUrl(url, shortDomain)) {
      return raw;
    }
    const shortUrl = shortUrlByOriginal.get(url);
    if (!shortUrl) {
      return raw;
    }
    return `${shortUrl}${trailing}`;
  });
}

function encodeUnambiguous(bytes: Buffer, length: number): string {
  const alphabet = SHORT_CODE_ALPHABET;
  const base = BigInt(alphabet.length);
  let value = BigInt(`0x${bytes.toString("hex")}`);
  let encoded = "";
  while (encoded.length < length) {
    encoded = alphabet[Number(value % base)] + encoded;
    value = value / base;
  }
  return encoded;
}
