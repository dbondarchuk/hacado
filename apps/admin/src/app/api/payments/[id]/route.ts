import { getServicesContainer } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/payments/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/payments/[id]")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      paymentId: id,
    },
    "Getting payment by ID",
  );

  try {
    const payment = await servicesContainer.paymentsService.getPayment(id);

    if (!payment) {
      logger.warn({ paymentId: id }, "Payment not found");
      return NextResponse.json(
        {
          success: false,
          error: "Payment not found",
          code: "payment_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug(
      {
        paymentId: id,
      },
      "Successfully retrieved payment",
    );

    return NextResponse.json(payment);
  } catch (error: any) {
    logger.error(
      {
        paymentId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to get payment",
    );

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get payment",
        code: "get_payment_failed",
      },
      { status: 500 },
    );
  }
}
