import { BaseAllKeys } from "@hacado/i18n";
import * as z from "zod";
import { zCountry, type Country } from "./country";
import { asOptionalField } from "./schema";

const zAddressLine = (maxKey: BaseAllKeys, max = 256) =>
  asOptionalField(z.string().trim().max(max, maxKey));

/** schema.org PostalAddress fields used for LocalBusiness JSON-LD. */
export const postalAddressSchema = z.object({
  streetAddress: zAddressLine(
    "validation.configuration.general.address.streetAddress.max",
    256,
  ),
  /** Suite / unit / floor — joined with streetAddress when formatting. */
  addressLine2: zAddressLine(
    "validation.configuration.general.address.addressLine2.max",
    128,
  ),
  addressLocality: zAddressLine(
    "validation.configuration.general.address.addressLocality.max",
    128,
  ),
  addressRegion: zAddressLine(
    "validation.configuration.general.address.addressRegion.max",
    128,
  ),
  postalCode: zAddressLine(
    "validation.configuration.general.address.postalCode.max",
    32,
  ),
  addressCountry: asOptionalField(zCountry),
});

export type PostalAddress = z.infer<typeof postalAddressSchema>;

/** Address suggestion from autocomplete (stable `id` + PostalAddress fields). */
export type AddressSuggestion = PostalAddress & {
  id: string;
};

/** Postal address plus a single-line `formatted` string for Mustache templates. */
export type PostalAddressTemplateValue = PostalAddress & {
  formatted: string;
};

function trimString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** True when any address field is present. */
export function hasPostalAddress(
  address: PostalAddress | null | undefined,
): boolean {
  if (!address) return false;
  return Boolean(
    address.streetAddress ||
      address.addressLine2 ||
      address.addressLocality ||
      address.addressRegion ||
      address.postalCode ||
      address.addressCountry,
  );
}

/**
 * Coerce legacy string addresses and strip empty objects.
 * Optional `countryFallback` fills `addressCountry` when missing.
 */
export function normalizePostalAddress(
  address: unknown,
  countryFallback?: Country | null,
): PostalAddress | undefined {
  if (address == null || address === "") return undefined;

  let raw: PostalAddress | undefined;
  if (typeof address === "string") {
    const streetAddress = trimString(address);
    if (!streetAddress) return undefined;
    raw = { streetAddress };
  } else if (typeof address === "object" && !Array.isArray(address)) {
    const o = address as Record<string, unknown>;
    raw = {
      streetAddress: trimString(o.streetAddress),
      addressLine2: trimString(o.addressLine2),
      addressLocality: trimString(o.addressLocality),
      addressRegion: trimString(o.addressRegion),
      postalCode: trimString(o.postalCode),
      addressCountry:
        (trimString(o.addressCountry) as Country | undefined) ?? undefined,
    };
  } else {
    return undefined;
  }

  if (!raw.addressCountry && countryFallback) {
    raw = { ...raw, addressCountry: countryFallback };
  }

  const parsed = postalAddressSchema.safeParse(raw);
  if (!parsed.success || !hasPostalAddress(parsed.data)) return undefined;
  return parsed.data;
}

/** Street line including optional suite/unit (`addressLine2`). */
export function formatPostalStreetAddress(
  address: PostalAddress | null | undefined,
): string {
  if (!address) return "";
  return [address.streetAddress, address.addressLine2]
    .filter(Boolean)
    .join(", ");
}

/** Single-line address for PDFs, calendars, llms.txt, and `address.formatted`. */
export function formatPostalAddress(
  address: PostalAddress | null | undefined,
  countryFallback?: Country | null,
  skipCountry?: boolean,
): string {
  const normalized = normalizePostalAddress(address, countryFallback);
  if (!normalized) return "";

  const line1 = formatPostalStreetAddress(normalized);
  const localityLine = [
    normalized.addressLocality,
    normalized.addressRegion,
    normalized.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  // Skip country for formatted address
  const country = skipCountry ? null : normalized.addressCountry;

  return [line1, localityLine, country].filter(Boolean).join(", ");
}

/**
 * Address value for Mustache templates: nested fields plus
 * `{{….address.formatted}}` for the single-line form.
 */
export function postalAddressForTemplates(
  address: PostalAddress | null | undefined,
  countryFallback?: Country | null,
  skipCountry?: boolean,
): PostalAddressTemplateValue | undefined {
  const normalized = normalizePostalAddress(address, countryFallback);
  if (!normalized) return undefined;

  return {
    ...normalized,
    formatted: formatPostalAddress(normalized, countryFallback, skipCountry),
  };
}

/** Optional address field that also accepts legacy plain strings. */
export const zPostalAddress = z.preprocess(
  (val) => normalizePostalAddress(val) ?? undefined,
  postalAddressSchema.optional(),
);
