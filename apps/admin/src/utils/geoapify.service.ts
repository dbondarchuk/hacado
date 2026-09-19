import { getLoggerFactory } from "@hacado/logger";
import {
  countryOptions,
  type AddressSuggestion,
  type Country,
  type WithTotal,
} from "@hacado/types";

const GEOAPIFY_AUTOCOMPLETE_URL =
  "https://api.geoapify.com/v1/geocode/autocomplete";

type GeoapifyAutocompleteResult = {
  place_id?: string;
  formatted?: string;
  address_line1?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
  country_code?: string;
  lat?: number;
  lon?: number;
};

type GeoapifyAutocompleteResponse = {
  results?: GeoapifyAutocompleteResult[];
};

export type GeoapifyAutocompleteParams = {
  text: string;
  limit?: number;
  /** Soft-rank results toward this country (ISO alpha-2). */
  countryBias?: Country | null;
  lang?: string;
};

function trimOrUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function toSupportedCountry(
  countryCode: string | undefined,
): Country | undefined {
  if (!countryCode) return undefined;
  const upper = countryCode.toUpperCase();
  return (countryOptions as readonly string[]).includes(upper)
    ? (upper as Country)
    : undefined;
}

function mapResult(result: GeoapifyAutocompleteResult): AddressSuggestion {
  const streetAddress =
    trimOrUndefined(
      [result.housenumber, result.street].filter(Boolean).join(" "),
    ) ?? trimOrUndefined(result.address_line1);

  const id =
    result.place_id ||
    [
      result.lon,
      result.lat,
      streetAddress,
      result.city,
      result.postcode,
      result.country_code,
    ]
      .filter((part) => part != null && part !== "")
      .join("|");

  return {
    id,
    streetAddress,
    addressLocality: trimOrUndefined(result.city),
    addressRegion:
      trimOrUndefined(result.state_code) ?? trimOrUndefined(result.state),
    postalCode: trimOrUndefined(result.postcode),
    addressCountry: toSupportedCountry(result.country_code),
  };
}

export class GeoapifyService {
  protected readonly loggerFactory = getLoggerFactory("GeoapifyService");

  public isConfigured(): boolean {
    return Boolean(process.env.GEOAPIFY_API_KEY?.trim());
  }

  private getApiKey(): string {
    const key = process.env.GEOAPIFY_API_KEY?.trim();
    if (!key) {
      throw new Error("GEOAPIFY_API_KEY is not configured");
    }
    return key;
  }

  public async autocomplete(
    params: GeoapifyAutocompleteParams,
  ): Promise<WithTotal<AddressSuggestion>> {
    const logger = this.loggerFactory("autocomplete");
    const text = params.text.trim();
    if (!text) {
      return { items: [], total: 0 };
    }

    const limit = Math.min(20, Math.max(1, params.limit ?? 10));
    const url = new URL(GEOAPIFY_AUTOCOMPLETE_URL);
    url.searchParams.set("text", text);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("apiKey", this.getApiKey());

    const biasCountry = (
      params.countryBias ?? countryOptions.join(",")
    ).toLowerCase();
    url.searchParams.set("bias", `countrycode:${biasCountry}`);

    if (params.lang) {
      url.searchParams.set("lang", params.lang);
    }

    logger.debug(
      { text, limit, biasCountry, lang: params.lang },
      "Requesting Geoapify autocomplete",
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logger.error(
        { status: response.status, body: body.slice(0, 500) },
        "Geoapify autocomplete failed",
      );
      throw new Error(`Geoapify autocomplete failed (${response.status})`);
    }

    const data = (await response.json()) as GeoapifyAutocompleteResponse;
    const items = (data.results ?? []).map(mapResult);

    logger.debug({ count: items.length }, "Geoapify autocomplete succeeded");

    return { items, total: items.length };
  }
}
