import { getActor, getServicesContainer, getSession } from "@/app/utils";
import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { resendPaymentLinkSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { IPaymentLinkProvider, PaymentLinkPayment } from "@hacado/types";
import { hasPermission } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const logger = getLoggerFactory("AdminAPI/payments/[id]/payment-link/resend")(
    "POST",
  );
  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const session = await getSession();
  const { id: paymentId } = await params;

  const body = await request.json();
  const { success, error, data } = resendPaymentLinkSchema.safeParse(body);

  if (!success) {
    logger.warn("Invalid request format");
    return NextResponse.json(
      { success: false, error, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug(
    {
      url: request.url,
      method: request.method,
      paymentId,
      channel: data.channel,
    },
    "Resending payment link",
  );

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

    if (!auth.ok) return auth.response;
  } else {
    const user = session?.user;
    if (!user?.id) {
      logger.warn("Unauthorized");
      return NextResponse.json(
        { success: false, code: "unauthorized", error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (
      !hasPermission(user, "customer", "update") &&
      !hasPermission(user, "billing", "manage")
    ) {
      logger.warn({ role: user.role }, "Forbidden");
      return NextResponse.json(
        { success: false, code: "forbidden", error: "Forbidden" },
        { status: 403 },
      );
    }
  }

  const paymentLinkPayment = payment as PaymentLinkPayment;
  const { app, service } =
    await servicesContainer.connectedAppsService.getAppService<IPaymentLinkProvider>(
      paymentLinkPayment.appId,
    );

  if (typeof service.sendPaymentLink !== "function") {
    logger.error(
      { appId: paymentLinkPayment.appId, appName: paymentLinkPayment.appName },
      "App does not implement sendPaymentLink",
    );

    return NextResponse.json(
      {
        success: false,
        error: "App does not support sending payment links",
        code: "payment_link_send_unsupported",
      },
      { status: 400 },
    );
  }

  await service.sendPaymentLink(app, payment, {
    channel: data.channel,
    to: data.to,
  });

  const updatedPayment = await servicesContainer.paymentsService.updatePayment(
    payment._id,
    data.channel === "email"
      ? { sentToEmail: data.to }
      : { sentToPhone: data.to },
    actor,
  );

  logger.debug({ paymentId }, "Payment link resent successfully");

  return NextResponse.json({ payment: updatedPayment });
}
