import { getActor, getServicesContainer } from "@/app/utils";
import { refundPaymentSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/payments/[id]/refund">,
) {
  const logger = getLoggerFactory("AdminAPI/payment-refund")("POST");
  const servicesContainer = await getServicesContainer();
  const actor = await getActor();
  const { id: paymentId } = await params;

  const body = await request.json();
  const { success, error, data } = refundPaymentSchema.safeParse(body);

  if (!success) {
    logger.warn("Invalid request format");
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const { amount } = data;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      paymentId,
      amount,
    },
    "Processing payment refund request",
  );

  const result = await servicesContainer.paymentsService.refundPayment(
    paymentId,
    amount,
    actor,
  );

  if (!result.success) {
    logger.warn(
      {
        paymentId,
        amount,
        error: result.error,
        status: result.status,
      },
      "Payment refund failed",
    );
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status },
    );
  }

  if (result.updatedPayment.appointmentId) {
    logger.debug(
      {
        appointmentId: result.updatedPayment.appointmentId,
      },
      "Adding appointment history",
    );

    await servicesContainer.bookingService.addAppointmentHistory({
      type: "paymentRefunded",
      data: {
        payment: {
          id: result.updatedPayment._id,
          amount: result.updatedPayment.amount,
          status: result.updatedPayment.status,
          method: result.updatedPayment.method,
          type: result.updatedPayment.type,
          appName:
            "appName" in result.updatedPayment
              ? result.updatedPayment.appName
              : undefined,
          externalId:
            "externalId" in result.updatedPayment
              ? result.updatedPayment.externalId
              : undefined,
        },
        refundedAmount: amount,
        totalRefunded:
          result.updatedPayment.refunds?.reduce(
            (acc, refund) => acc + refund.amount,
            0,
          ) || 0,
      },
      appointmentId: result.updatedPayment.appointmentId,
    });
  }

  logger.debug(
    {
      paymentId,
      success: result.success,
    },
    "Payment refund successful",
  );

  return NextResponse.json(
    { success: true, payment: result.updatedPayment },
    { status: 201 },
  );
}
