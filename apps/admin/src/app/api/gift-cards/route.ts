import { getActor, getServicesContainer } from "@/app/utils";
import { giftCardsSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { giftCardSchema } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/gift-cards")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing gift cards API request",
  );

  const params = giftCardsSearchParamsLoader(request.nextUrl.searchParams);

  const page = params.page;
  const search = params.search ?? undefined;
  const limit = params.limit;
  const sort = params.sort;

  const offset = (page - 1) * limit;
  const priorityIds = params.priorityId ?? undefined;
  const status = params.status ?? undefined;
  const expiresAtStart = params.expiresAtStart ?? undefined;
  const expiresAtEnd = params.expiresAtEnd ?? undefined;
  const customerId = params.customerId ?? undefined;

  const res = await servicesContainer.giftCardsService.getGiftCards({
    offset,
    limit,
    search,
    sort,
    priorityIds,
    status,
    expiresAt: {
      start: expiresAtStart,
      end: expiresAtEnd,
    },
    customerId,
  });

  logger.debug(
    {
      total: res.total,
      count: res.items.length,
    },
    "Successfully retrieved gift cards",
  );

  return NextResponse.json(res);
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/gift-cards")("POST");
  const servicesContainer = await getServicesContainer();
  const actor = await getActor();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing create gift card API request",
  );

  const body = await request.json();

  const { data, error, success } = giftCardSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid gift card update model format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug({ giftCard: data }, "Creating gift card");
  const giftCard = await servicesContainer.giftCardsService.createGiftCard(
    data,
    actor,
  );

  logger.debug({ giftCardId: giftCard._id }, "Gift card created successfully");
  return NextResponse.json(giftCard, { status: 201 });
}
