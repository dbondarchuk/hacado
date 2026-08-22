import { getActor, getServicesContainer } from "@/app/utils";
import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { requirePermission } from "@/lib/auth/require-permission";
import { getLoggerFactory } from "@hacado/logger";
import {
  inStorePaymentUpdateModelSchema,
  PaymentUpdateModel,
} from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/payments/instore")("POST");
  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing add instore payments API request",
  );

  const body = await request.json();

  const {
    data: payment,
    success,
    error,
  } = inStorePaymentUpdateModelSchema.safeParse(body);

  if (!success) {
    logger.warn("Invalid request format");
    return NextResponse.json(
      { success: false, error, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  let customerId: string | undefined;

  if (payment.appointmentId) {
    const auth = await requireCanUpdateAppointment(
      payment.appointmentId,
      logger,
    );
    if (!auth.ok) return auth.response;

    customerId = auth.appointment.customerId;
  } else if ("customerId" in payment && payment.customerId) {
    const customer = await servicesContainer.customersService.getCustomer(
      payment.customerId,
    );

    if (!customer) {
      logger.error(
        { customerId: payment.customerId, payment },
        "Customer not found",
      );

      return NextResponse.json(
        {
          success: false,
          error: "Customer not found",
          code: "customer_not_found",
        },
        { status: 404 },
      );
    }

    customerId = customer._id;
  }

  if (!customerId) {
    logger.error({ payment }, "Customer ID not found");
    return NextResponse.json(
      {
        success: false,
        error: "Customer ID not found",
        code: "customer_id_not_found",
      },
      { status: 400 },
    );
  }

  let paymentUpdateModel: PaymentUpdateModel;

  if (payment.method === "gift-card") {
    const payAuth = await requirePermission("giftCard", "pay", logger);
    if (!payAuth.ok) return payAuth.response;

    const giftCard = await servicesContainer.giftCardsService.getGiftCard(
      payment.giftCardId,
    );
    if (!giftCard) {
      return NextResponse.json(
        {
          success: false,
          error: "Gift card not found",
          code: "gift_card_not_found",
        },
        { status: 404 },
      );
    }

    if (giftCard.status === "inactive") {
      return NextResponse.json(
        {
          success: false,
          error: "Gift card is inactive",
          code: "gift_card_inactive",
        },
        { status: 400 },
      );
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Gift card expired",
          code: "gift_card_expired",
        },
        { status: 400 },
      );
    }

    if (giftCard.amountLeft < payment.amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Gift card amount is not enough",
          code: "gift_card_amount_not_enough",
        },
        { status: 400 },
      );
    }

    paymentUpdateModel = {
      ...payment,
      customerId,
      status: "paid",
      method: "gift-card",
      giftCardCode: giftCard.code,
      giftCardId: giftCard._id,
    };
  } else {
    paymentUpdateModel = {
      ...payment,
      customerId,
      status: "paid",
    };
  }

  const result = await servicesContainer.paymentsService.createPayment(
    paymentUpdateModel,
    actor,
  );

  logger.debug(
    { appointmentId: payment.appointmentId, payment },
    "In-store appointment payment added successfully",
  );

  return NextResponse.json(result, { status: 201 });
}
