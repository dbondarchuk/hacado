import { getLoggerFactory } from "@hacado/logger";
import type { PaymentUpdatedPayload } from "@hacado/types/events";
import { PAYMENT_UPDATED_EVENT_TYPE } from "@hacado/types/events";
import { claimEventHandler } from "../claim-event-handler";
import type { EventHandler } from "./types";

export const giftCardPaymentHandler: EventHandler = {
  name: "gift-card-payment",
  async run({ envelope, services, redis }) {
    if (envelope.type !== PAYMENT_UPDATED_EVENT_TYPE) return;

    const { payment, update } = envelope.payload as PaymentUpdatedPayload;
    if (payment.method !== "payment-link" || update.status !== "paid") return;

    const giftCard = await services.giftCardsService.getGiftCardByPaymentId(
      payment._id,
    );

    if (!giftCard || giftCard.status === "active") return;

    const claimed = await claimEventHandler(
      redis,
      envelope.organizationId,
      envelope.id,
      "gift-card-payment",
    );

    if (!claimed) return;

    const logger = getLoggerFactory("Events/GiftCardPayment")("run");
    logger.debug(
      { paymentId: payment._id, giftCardId: giftCard._id },
      "Activating gift card after payment link paid",
    );

    await services.giftCardsService.setGiftCardStatus(
      giftCard._id,
      "active",
      envelope.source,
    );
  },
};
