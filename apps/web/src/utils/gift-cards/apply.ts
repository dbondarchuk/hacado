import { getLoggerFactory } from "@hacado/logger";
import {
  ApplyGiftCardsResponse,
  ApplyGiftCardsSuccessResponse,
} from "@hacado/types";
import { getServicesContainer, sessionCanUseFeature } from "../utils";

export const applyGiftCards = async (
  codes: string[],
  amount: number,
): Promise<ApplyGiftCardsResponse> => {
  const logger = getLoggerFactory("GiftCardsUtils")("getGiftCardsPayments");

  if (!(await sessionCanUseFeature("giftCards"))) {
    return {
      success: false,
      code: "subscription_upgrade_required",
      error: "Gift cards are not available on this plan.",
    } satisfies ApplyGiftCardsResponse;
  }

  const servicesContainer = await getServicesContainer();

  logger.debug({ codes, amount }, "Getting gift cards payments");

  let remainingAmount = amount;
  const giftCards: ApplyGiftCardsSuccessResponse["giftCards"] = [];
  for (const code of codes) {
    logger.debug({ code, remainingAmount }, "Applying gift card");
    const giftCard =
      await servicesContainer.giftCardsService.getGiftCardByCode(code);
    if (!giftCard) {
      logger.warn({ code }, "Gift card not found");
      return {
        success: false,
        code: "code_not_found",
        error: "Code not found",
      } satisfies ApplyGiftCardsResponse;
    }

    if (giftCard.status === "inactive") {
      logger.warn({ code }, "Gift card is inactive");
      return {
        success: false,
        code: "gift_card_inactive",
        error: "Gift card is inactive",
      } satisfies ApplyGiftCardsResponse;
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      logger.warn({ code }, "Gift card expired");
      return {
        success: false,
        code: "gift_card_expired",
        error: "Gift card expired",
      } satisfies ApplyGiftCardsResponse;
    }

    if (giftCard.amountLeft <= 0) {
      logger.warn({ code }, "Gift card amount left is 0");
      return {
        success: false,
        code: "gift_card_amount_exhausted",
        error: "Gift card amount left is 0",
      } satisfies ApplyGiftCardsResponse;
    }

    const appliedAmount = Math.min(remainingAmount, giftCard.amountLeft);
    const amountLeft = Math.max(0, giftCard.amountLeft - appliedAmount);
    remainingAmount -= appliedAmount;
    logger.debug(
      { code, appliedAmount, amountLeft, remainingAmount },
      "Gift card applied",
    );
    giftCards.push({ id: giftCard._id, code, appliedAmount, amountLeft });
    if (remainingAmount <= 0) {
      logger.debug("No remaining amount, stopping gift card application");
      break;
    }
  }

  logger.debug({ giftCards }, "Gift cards applied");

  return {
    success: true,
    giftCards,
  } satisfies ApplyGiftCardsResponse;
};
