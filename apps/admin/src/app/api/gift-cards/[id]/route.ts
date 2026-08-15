import { getActor, getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { giftCardSchema, okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/gift-cards/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/gift-cards/[id]")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      giftCardId: id,
    },
    "Processing get gift card by ID API request",
  );

  const giftCard = await servicesContainer.giftCardsService.getGiftCard(id);

  if (!giftCard) {
    logger.warn({ giftCardId: id }, "Gift card not found");
    return NextResponse.json(
      {
        success: false,
        error: "Gift card not found",
        code: "gift_card_not_found",
      },
      { status: 404 },
    );
  }

  logger.debug(
    { giftCardId: id, giftCardCode: giftCard.code },
    "Gift card found",
  );

  return NextResponse.json(giftCard);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/gift-cards/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/gift-cards/[id]")("PUT");
  const servicesContainer = await getServicesContainer();
  const actor = await getActor();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      giftCardId: id,
    },
    "Processing update gift card by ID API request",
  );

  const body = await request.json();
  const { data, success, error } = giftCardSchema.safeParse(body);

  if (!success) {
    logger.warn({ error }, "Invalid gift card update model format");
    return NextResponse.json(
      {
        success: false,
        error: "Invalid gift card update model format",
        code: "invalid_request_format",
      },
      { status: 400 },
    );
  }

  await servicesContainer.giftCardsService.updateGiftCard(id, data, actor);

  logger.debug(
    { giftCardId: id, giftCardCode: data.code },
    "Gift card updated successfully",
  );

  return NextResponse.json(okStatus, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/gift-cards/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/gift-cards/[id]")("DELETE");
  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      giftCardId: id,
    },
    "Processing delete gift card by ID API request",
  );

  const result = await servicesContainer.giftCardsService.deleteGiftCard(
    id,
    actor,
  );

  if (!result) {
    logger.warn({ giftCardId: id }, "Gift card not found");
    return NextResponse.json(
      {
        success: false,
        error: "Gift card not found",
        code: "gift_card_not_found",
      },
      { status: 404 },
    );
  }

  logger.debug({ giftCardId: id }, "Gift card deleted successfully");
  return NextResponse.json(result, { status: 200 });
}
