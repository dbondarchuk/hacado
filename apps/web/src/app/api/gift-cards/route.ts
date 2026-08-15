import { applyGiftCards } from "@/utils/gift-cards/apply";
import { getLoggerFactory } from "@hacado/logger";
import {
  applyGiftCardsRequestSchema,
  ApplyGiftCardsResponse,
  ApplyGiftCardsSuccessResponse,
} from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("API/gift-cards")("POST");
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing gift cards API request",
  );

  const body = await request.json();

  const { data, error, success } = applyGiftCardsRequestSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid gift card request format");
    return NextResponse.json(
      {
        success: false,
        code: "invalid_request_format",
        error,
      } satisfies ApplyGiftCardsResponse,
      { status: 400 },
    );
  }

  logger.debug(
    {
      code: data.codes,
      amount: data.amount,
    },
    "Applying gift card",
  );

  const result = await applyGiftCards(data.codes, data.amount);
  if (!result.success) {
    logger.warn({ error: result.error }, "Failed to apply gift cards");
    return NextResponse.json(result, {
      status: result.code === "subscription_upgrade_required" ? 402 : 400,
    });
  }

  //clear ids from gift cards
  const giftCards = result.giftCards.map((giftCard) => ({
    ...giftCard,
    id: "",
  }));

  logger.debug(
    { giftCards: result.giftCards },
    "Gift cards applied successfully",
  );
  return NextResponse.json(
    { success: true, giftCards } satisfies ApplyGiftCardsSuccessResponse,
    { status: 200 },
  );
}
