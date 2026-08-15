import { templateSafeWithError } from "@hacado/utils";

/** Placeholders supported in URL and header templates (Mustache `{{name}}`). */
export type UrlScheduleProviderPlaceholderValues = {
  memberId: string;
  email: string;
  /** Range start in ISO format. */
  start: string;
  /** Range end in ISO format. */
  end: string;
};

const PLACEHOLDER_SAMPLES: UrlScheduleProviderPlaceholderValues = {
  memberId: "000000000000000000000000",
  email: "member@example.com",
  start: "2024-01-01T00:00:00.000Z",
  end: "2024-01-08T00:00:00.000Z",
};

function encodePlaceholderValues(
  values: UrlScheduleProviderPlaceholderValues,
): UrlScheduleProviderPlaceholderValues {
  return {
    memberId: encodeURIComponent(values.memberId),
    email: encodeURIComponent(values.email),
    start: encodeURIComponent(values.start),
    end: encodeURIComponent(values.end),
  };
}

/** Replace Mustache placeholders in a URL (URI-encoded values). */
export function applyUrlPlaceholders(
  url: string,
  values: UrlScheduleProviderPlaceholderValues,
): string {
  return templateSafeWithError(url, encodePlaceholderValues(values), true);
}

/** Replace Mustache placeholders in a header key or value (raw). */
export function applyHeaderPlaceholders(
  value: string,
  values: UrlScheduleProviderPlaceholderValues,
): string {
  return templateSafeWithError(value, values, true);
}

export function buildHeadersWithPlaceholders(
  configuredHeaders: { key: string; value: string }[] | undefined | null,
  values: UrlScheduleProviderPlaceholderValues,
  base: Record<string, string> = { "Content-Type": "application/json" },
): Record<string, string> {
  const headers = { ...base };
  if (!configuredHeaders) return headers;

  for (const header of configuredHeaders) {
    if (!header.key || !header.value) continue;
    headers[applyHeaderPlaceholders(header.key, values)] =
      applyHeaderPlaceholders(header.value, values);
  }

  return headers;
}

/** Replace placeholders with sample values for URL validation. */
export function withUrlPlaceholderSamples(url: string): string {
  return applyUrlPlaceholders(url, PLACEHOLDER_SAMPLES);
}

export function isValidUrlWithPlaceholders(url: string): boolean {
  try {
    new URL(withUrlPlaceholderSamples(url));
    return true;
  } catch {
    return false;
  }
}
