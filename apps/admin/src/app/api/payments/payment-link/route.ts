import { getActor, getServicesContainer, getSession } from "@/app/utils";
import { requireCanUpdateAppointment } from "@/lib/auth/require-appointment-update";
import { sessionCanUseFeature } from "@/lib/billing/subscription-plan-access";
import { createPaymentLinkSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { IPaymentLinkProvider, PaymentUpdateModel } from "@hacado/types";
import { hasPermission } from "@hacado/utils";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/payments/payment-link")("POST");
  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const session = await getSession();

  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing create payment link API request",
  );

  const body = await request.json();
  const {
    data: payload,
    success,
    error,
  } = createPaymentLinkSchema.safeParse(body);

  if (!success) {
    logger.warn("Invalid request format");
    return NextResponse.json(
      { success: false, error, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  if (payload.appointmentId) {
    const auth = await requireCanUpdateAppointment(
      payload.appointmentId,
      logger,
    );
    if (!auth.ok) return auth.response;

    if (auth.appointment.customerId !== payload.customerId) {
      logger.warn(
        {
          appointmentId: payload.appointmentId,
          customerId: payload.customerId,
          appointmentCustomerId: auth.appointment.customerId,
        },
        "Customer ID does not match appointment",
      );
      return NextResponse.json(
        {
          success: false,
          error: "Customer ID does not match appointment",
          code: "customer_mismatch",
        },
        { status: 400 },
      );
    }
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

  if (!sessionCanUseFeature(session, "payments")) {
    logger.warn("Payments feature not available on plan");
    return NextResponse.json(
      {
        success: false,
        error: "Payments feature not available",
        code: "payments_feature_unavailable",
      },
      { status: 403 },
    );
  }

  const defaultApps =
    await servicesContainer.configurationService.getConfiguration(
      "defaultApps",
    );

  if (!defaultApps?.paymentAppId) {
    logger.warn("Default payment app is not configured");
    return NextResponse.json(
      {
        success: false,
        error: "Default payment app is required",
        code: "payment_app_required",
      },
      { status: 400 },
    );
  }

  const customer = await servicesContainer.customersService.getCustomer(
    payload.customerId,
  );

  if (!customer) {
    logger.error({ customerId: payload.customerId }, "Customer not found");
    return NextResponse.json(
      {
        success: false,
        error: "Customer not found",
        code: "customer_not_found",
      },
      { status: 404 },
    );
  }

  const paymentLinkApps =
    await servicesContainer.connectedAppsService.getAppsByScope("payment-link");
  const paymentLinkApp = paymentLinkApps.find(
    (app) => app._id === payload.paymentLinkAppId,
  );

  if (!paymentLinkApp) {
    logger.warn(
      { paymentLinkAppId: payload.paymentLinkAppId },
      "Payment link app not found or missing payment-link scope",
    );
    return NextResponse.json(
      {
        success: false,
        error: "Payment link app not found",
        code: "payment_link_app_not_found",
      },
      { status: 404 },
    );
  }

  const now = new Date();
  const publicId = randomBytes(16).toString("hex");

  const paymentUpdateModel: PaymentUpdateModel = {
    amount: payload.amount,
    status: "pending",
    method: "payment-link",
    paidAt: undefined,
    createdAt: now,
    customerId: payload.customerId,
    appointmentId: payload.appointmentId,
    description: payload.description ?? "",
    type: payload.type,
    appId: paymentLinkApp._id,
    appName: paymentLinkApp.name,
    publicId,
  };

  const payment = await servicesContainer.paymentsService.createPayment(
    paymentUpdateModel,
    actor,
  );

  const { app, service } =
    await servicesContainer.connectedAppsService.getAppService<IPaymentLinkProvider>(
      paymentLinkApp._id,
    );

  if (typeof service.createPaymentLink !== "function") {
    logger.error(
      { appId: paymentLinkApp._id, appName: paymentLinkApp.name },
      "App does not implement createPaymentLink",
    );
    return NextResponse.json(
      {
        success: false,
        error: "App does not support payment links",
        code: "payment_link_unsupported",
      },
      { status: 400 },
    );
  }

  const linkResult = await service.createPaymentLink(app, {
    amount: payment.amount,
    customerId: payment.customerId,
    appointmentId: payment.appointmentId,
    description: payment.description,
    type: payment.type,
    paymentId: payment._id,
  });

  let updatedPayment = payment;

  if (payload.channel === "email" || payload.channel === "sms") {
    if (typeof service.sendPaymentLink !== "function") {
      logger.error(
        { appId: paymentLinkApp._id, appName: paymentLinkApp.name },
        "App does not implement sendPaymentLink",
      );
      return NextResponse.json(
        {
          success: false,
          error: "App does not support sending payment links",
          code: "payment_link_send_unsupported",
          payment,
          url: linkResult.url,
        },
        { status: 400 },
      );
    }

    await service.sendPaymentLink(app, payment, {
      channel: payload.channel,
      to: payload.to!,
    });

    updatedPayment = await servicesContainer.paymentsService.updatePayment(
      payment._id,
      payload.channel === "email"
        ? { sentToEmail: payload.to }
        : { sentToPhone: payload.to },
      actor,
    );
  }

  logger.debug(
    { paymentId: updatedPayment._id, channel: payload.channel },
    "Payment link created successfully",
  );

  return NextResponse.json(
    { payment: updatedPayment, url: linkResult.url },
    { status: 201 },
  );
}
