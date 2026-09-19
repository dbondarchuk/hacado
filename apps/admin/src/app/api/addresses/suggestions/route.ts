import { getSession } from "@/app/utils";
import { GeoapifyService } from "@/utils/geoapify.service";
import { addressesSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { countryOptions, type Country } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MIN_SEARCH_LENGTH = 2;

function parseCountryBias(
  value: string | null | undefined,
): Country | undefined {
  if (!value) return undefined;
  const upper = value.trim().toUpperCase();
  return (countryOptions as readonly string[]).includes(upper)
    ? (upper as Country)
    : undefined;
}

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/addresses/suggestions")("GET");
  const session = await getSession();
  if (!session) {
    logger.warn("Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = new GeoapifyService();
  if (!service.isConfigured()) {
    logger.warn("Geoapify is not configured");
    return NextResponse.json(
      { error: "Address suggestions are not configured" },
      { status: 503 },
    );
  }

  const params = addressesSearchParamsLoader(request.nextUrl.searchParams);
  const page = Math.max(1, params.page);
  const limit = Math.min(20, Math.max(1, params.limit));
  const search = params.search?.trim() || undefined;
  const countryBias = parseCountryBias(params.country);

  if (!search || search.length < MIN_SEARCH_LENGTH) {
    return NextResponse.json({ items: [], total: 0 });
  }

  // Geoapify autocomplete has no offset; only the first page is fetched.
  if (page > 1) {
    return NextResponse.json({ items: [], total: 0 });
  }

  try {
    const result = await service.autocomplete({
      text: search,
      limit,
      countryBias,
    });

    logger.debug(
      {
        page,
        limit,
        search,
        countryBias,
        total: result.total,
        count: result.items.length,
      },
      "Address suggestions retrieved",
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "Address suggestions failed");
    return NextResponse.json(
      { error: "Failed to fetch address suggestions" },
      { status: 502 },
    );
  }
}
