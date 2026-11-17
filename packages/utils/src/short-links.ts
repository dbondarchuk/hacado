export function isSmsLinkShorteningEnabled(
  value = process.env.SMS_LINK_SHORTENING_ENABLED,
): boolean {
  if (!value) {
    return false;
  }

  return value === "true" || value === "1";
}

/** Same alphabet as real short codes (no ambiguous 0/O/1/I/l). */
const PREVIEW_SHORT_CODE_ALPHABET =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

const PREVIEW_SHORT_CODE_LENGTH = 8;

const TRAILING_PUNCTUATION_PATTERN = /[.,;:!?)\]}]+$/;

function httpUrlPattern(): RegExp {
  return /https?:\/\/[^\s<>"']+/gi;
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

/** Deterministic fake code for previews (not the production SHA-256 code). */
export function previewShortCode(
  url: string,
  length = PREVIEW_SHORT_CODE_LENGTH,
): string {
  let hash = 2166136261 >>> 0;

  for (let index = 0; index < url.length; index++) {
    hash ^= url.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  let state = hash;
  let encoded = "";

  while (encoded.length < length) {
    encoded =
      PREVIEW_SHORT_CODE_ALPHABET[state % PREVIEW_SHORT_CODE_ALPHABET.length] +
      encoded;

    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  }

  return encoded;
}

function stripTrailingUrlPunctuation(raw: string): {
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

function isHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isShortLinkUrl(urlString: string, shortDomain: string): boolean {
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

/**
 * Replace http(s) URLs with fake short links on the configured short domain.
 * Used for SMS template preview when link shortening is enabled.
 */
export function previewShortenUrlsInText(
  body: string,
  shortDomain: string,
): string {
  if (!body || !shortDomain) {
    return body;
  }

  return body.replace(httpUrlPattern(), (raw) => {
    const { url, trailing } = stripTrailingUrlPunctuation(raw);

    if (!isHttpUrl(url) || isShortLinkUrl(url, shortDomain)) {
      return raw;
    }

    return `${buildShortLinkUrl(previewShortCode(url), shortDomain)}${trailing}`;
  });
}
