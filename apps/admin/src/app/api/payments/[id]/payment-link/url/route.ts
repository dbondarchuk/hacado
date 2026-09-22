import { getServicesContainer, getSession, getWebsiteUrl } from "@/app/utils";
import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { getLoggerFactory } from "@hacado/logger";
import { PaymentLinkPayment } from "@hacado/types";
import { hasPermission } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const logger = getLoggerFactory("AdminAPI/payments/[id]/payment-link/url")(
    "GET",
  );
  const servicesContainer = await getServicesContainer();
  const session = await getSession();
  const { id: paymentId } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      paymentId,
    },
    "Getting payment link URL",
  );

  const user = session?.user;
  if (!user?.id) {
    logger.warn("Unauthorized");
    return NextResponse.json(
      { success: false, code: "unauthorized", error: "Unauthorized" },
      { status: 401 },
    );
  }

  const payment = await servicesContainer.paymentsService.getPayment(paymentId);

  if (!payment) {
    logger.warn({ paymentId }, "Payment not found");
    return NextResponse.json(
      {
        success: false,
        error: "Payment not found",
        code: "payment_not_found",
      },
      { status: 404 },
    );
  }

  if (payment.method !== "payment-link" || payment.status !== "pending") {
    logger.warn(
      { paymentId, method: payment.method, status: payment.status },
      "Payment is not a pending payment link",
    );

    return NextResponse.json(
      {
        success: false,
        error: "Payment is not a pending payment link",
        code: "invalid_payment_link_state",
      },
      { status: 400 },
    );
  }

  if (payment.appointmentId) {
    const auth = await requireCanUpdateAppointment(
      payment.appointmentId,
      logger,
    );

    logger.debug(
      { appointmentId: payment.appointmentId },
      "Checking appointment update authorization",
    );

    if (!auth.ok) {
      logger.warn({ appointmentId: payment.appointmentId }, "Forbidden");
      return auth.response;
    }
  } else if (
    !hasPermission(user, "customer", "update") &&
    !hasPermission(user, "billing", "manage")
  ) {
    logger.warn({ role: user.role }, "Forbidden");
    return NextResponse.json(
      { success: false, code: "forbidden", error: "Forbidden" },
      { status: 403 },
    );
  }

  const paymentLinkPayment = payment as PaymentLinkPayment;
  const websiteUrl = await getWebsiteUrl();
  const url = `${websiteUrl}/payment?id=${paymentLinkPayment.publicId}`;

  logger.debug({ paymentId }, "Returning payment link URL");

  return NextResponse.json({ url });
}
