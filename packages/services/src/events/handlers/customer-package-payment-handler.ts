import { getLoggerFactory } from "@hacado/logger";
import {
  PAYMENT_UPDATED_EVENT_TYPE,
  type PaymentUpdatedPayload,
} from "@hacado/types";
import { claimEventHandler } from "../claim-event-handler";
import type { EventHandler } from "./types";

export const customerPackagePaymentHandler: EventHandler = {
  name: "customer-package-payment",
  async run({ envelope, services, redis }) {
    if (envelope.type !== PAYMENT_UPDATED_EVENT_TYPE) return;

    const { payment, update } = envelope.payload as PaymentUpdatedPayload;
    if (payment.method !== "payment-link") return;
    if (update.status !== "paid" && update.status !== "cancelled") return;

    const claimed = await claimEventHandler(
      redis,
      envelope.organizationId,
      envelope.id,
      "customer-package-payment",
    );

    if (!claimed) return;

    const logger = getLoggerFactory("Events/CustomerPackagePayment")("run");
    if (update.status === "paid") {
      logger.debug(
        { paymentId: payment._id },
        "Activating package after payment link paid",
      );

      await services.packagesService.activatePendingByPaymentId(
        payment._id,
        envelope.source,
      );
    } else {
      logger.debug(
        { paymentId: payment._id },
        "Cancelling package after payment link cancelled",
      );

      await services.packagesService.cancelPendingByPaymentId(
        payment._id,
        envelope.source,
      );
    }
  },
};
