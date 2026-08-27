import { assertBookingCustomerAccess } from "@/utils/appointments/assert-booking-customer-access";
import { getAppointmentEventAndIsPaymentRequired } from "@/utils/appointments/get-payment-required";
import { getLoggerFactory } from "@hacado/logger";
import {
  AppointmentRequest,
  CollectPayment,
  createOrUpdatePaymentIntentRequestSchema,
  IPaymentProcessor,
  ModifyAppointmentRequest,
  PaymentIntentUpdateModel,
  PaymentType,
} from "@hacado/types";
import { deepEqual } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";
import { getModifyAppointmentInformationRequestResult } from "../appointments/get-modify-appointment-request";
import {
  CustomerSessionRequiredError,
  requireCustomerSession,
} from "../customer-auth/session";
import { getServicesContainer, sessionCanUseFeature } from "../utils";

const createOrUpdateAppointmentRequestIntent = async (
  appointmentRequest: AppointmentRequest,
  type: Exclude<PaymentType, "rescheduleFee" | "cancellationFee">,
  intentId?: string,
): Promise<NextResponse> => {
  const logger = getLoggerFactory("PaymentsUtils")(
    "createOrUpdateAppointmentRequestIntent",
  );

  const servicesContainer = await getServicesContainer();

  logger.debug({ type }, "Creating or updating appointment request intent");

  const otpGate = await assertBookingCustomerAccess(appointmentRequest, logger);
  if (otpGate) return otpGate;

  const isPaymentRequired = await getAppointmentEventAndIsPaymentRequired(
    appointmentRequest,
    true,
  );

  if (!isPaymentRequired) {
    logger.warn({ appointmentRequest }, "IsPaymentRequired is null");
    return NextResponse.json(null);
  }

  if ("error" in isPaymentRequired) {
    logger.error(
      {
        error: isPaymentRequired.error,
        appointmentRequest,
      },
      "Failed to get event or is payment required",
    );

    return NextResponse.json(
      {
        success: false,
        error: isPaymentRequired.error.code,
        message: isPaymentRequired.error.message,
      },
      { status: isPaymentRequired.error.status },
    );
  }

  if (!isPaymentRequired.isPaymentRequired) {
    logger.debug({ appointmentRequest }, "payment is not required");

    return NextResponse.json(null);
  }

  logger.debug({ ...isPaymentRequired, intentId }, "Payment is required.");

  const {
    amount,
    amountPaid,
    amountTotal,
    giftCards,
    appId,
    customer,
    isFixedAmount,
  } = isPaymentRequired;

  const { app, service } =
    await servicesContainer.connectedAppsService.getAppService<IPaymentProcessor>(
      appId,
    );

  const formProps = service.getFormProps(app);

  if (intentId) {
    const intent = await servicesContainer.paymentsService.getIntent(intentId);
    if (!intent) {
      logger.warn({ intentId }, "Intent not found");
      return NextResponse.json(
        {
          error: "intent_not_found",
          message: "Intent not found",
          code: "intent_not_found",
          success: false,
        },
        { status: 404 },
      );
    }

    if (intent.status === "paid") {
      logger.debug({ intentId }, "Intent is already paid");

      if (
        intent.amount !== amount ||
        intent.appId !== appId ||
        intent.customerId !== customer?._id ||
        intent.type !== type ||
        !deepEqual(intent.request, appointmentRequest)
      ) {
        logger.warn({ intentId }, "Intent does not match the request");
        return NextResponse.json(
          {
            error: "intent_does_not_match_the_request",
            message: "Intent does not match the request",
            code: "intent_does_not_match_the_request",
            success: false,
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        formProps,
        intent,
        amount,
        amountPaid,
        amountTotal,
        giftCards: giftCards?.map((giftCard) => ({
          code: giftCard.code,
          amountApplied: giftCard.appliedAmount,
        })),
        isFixedAmount,
      } satisfies CollectPayment);
    }
  }

  const intentUpdate = {
    amount,
    appId: app._id,
    appName: app.name,
    request: appointmentRequest,
    customerId: customer?._id,
    type: type,
  } satisfies Omit<PaymentIntentUpdateModel, "status">;

  logger.debug(
    { intent: intentUpdate, isUpdating: !!intentId },
    "Creating or updating intent",
  );

  const intentResult = intentId
    ? await servicesContainer.paymentsService.updateIntent(intentId, {
        ...intentUpdate,
        status: "created",
      })
    : await servicesContainer.paymentsService.createIntent(intentUpdate);

  const { request: _, ...intent } = intentResult;

  logger.debug(
    { intent, isUpdating: !!intentId },
    "Successfully created or updated intent",
  );

  return NextResponse.json({
    formProps,
    intent,
    amount,
    amountPaid,
    amountTotal,
    giftCards: giftCards?.map((giftCard) => ({
      code: giftCard.code,
      amountApplied: giftCard.appliedAmount,
    })),
    isFixedAmount,
  } satisfies CollectPayment);
};

const createOrUpdateModifyAppointmentRequestIntent = async (
  modifyAppointmentRequest: ModifyAppointmentRequest,
  appointmentId: string,
  type: Extract<PaymentType, "rescheduleFee" | "cancellationFee">,
  intentId?: string,
) => {
  const logger = getLoggerFactory("PaymentsUtils")(
    "createOrUpdateModifyAppointmentRequestIntent",
  );
  const servicesContainer = await getServicesContainer();

  logger.debug({ intentId }, "Creating or updating intent");

  if (
    type === "rescheduleFee" &&
    modifyAppointmentRequest.type !== "reschedule"
  ) {
    logger.error(
      { modifyAppointmentRequest, type },
      "Modify appointment request is not a reschedule",
    );

    return NextResponse.json(
      {
        error: {
          code: "modify_appointment_request_not_a_reschedule",
          message: "Modify appointment request is not a reschedule",
        },
      },
      { status: 400 },
    );
  }

  if (
    type === "cancellationFee" &&
    modifyAppointmentRequest.type !== "cancel"
  ) {
    logger.error(
      { modifyAppointmentRequest, type },
      "Modify appointment request is not a cancellation",
    );

    return NextResponse.json(
      {
        error: {
          code: "modify_appointment_request_not_a_cancellation",
          message: "Modify appointment request is not a cancellation",
        },
      },
      { status: 400 },
    );
  }

  const session = await requireCustomerSession();

  const modifyAppointmentRequestResult =
    await getModifyAppointmentInformationRequestResult(
      {
        lookup: "appointmentId",
        type: modifyAppointmentRequest.type,
        appointmentId,
        giftCards: modifyAppointmentRequest.giftCards,
      },
      session,
    );

  if ("error" in modifyAppointmentRequestResult) {
    logger.error(
      { modifyAppointmentRequestResult },
      "Failed to get modify appointment request",
    );
    return NextResponse.json(modifyAppointmentRequestResult.error, {
      status: 400,
    });
  }

  const { information, customerId } = modifyAppointmentRequestResult;

  if (!information.allowed) {
    logger.debug(
      { modifyAppointmentRequestResult },
      "Modify appointment request not allowed",
    );
    return NextResponse.json(null);
  }

  if (
    (information.type === "reschedule" &&
      information.action !== "paymentRequired") ||
    (information.type === "cancel" && information.action !== "payment")
  ) {
    logger.debug(
      { modifyAppointmentRequestResult },
      "Modify appointment request not required to pay",
    );
    return NextResponse.json(null);
  }

  if (
    (information.type === "cancel" &&
      information.action === "payment" &&
      !information.paymentAmount) ||
    (information.type === "reschedule" &&
      information.action === "paymentRequired" &&
      !information.paymentAmount)
  ) {
    logger.debug(
      { modifyAppointmentRequestResult },
      "Payment amount is not set or is 0",
    );
    return NextResponse.json(null);
  }

  logger.debug(
    { modifyAppointmentRequestResult, intentId },
    "Payment is required.",
  );

  const canUsePayments = await sessionCanUseFeature("payments");
  const { booking: config, defaultApps } =
    await servicesContainer.configurationService.getConfigurations(
      "booking",
      "defaultApps",
    );
  const paymentAppId = defaultApps?.paymentAppId;

  if (!canUsePayments || !config.payments?.enabled || !paymentAppId) {
    logger.warn(
      { modifyAppointmentRequestResult },
      "Payment required but online payments are not available",
    );
    return NextResponse.json(
      {
        success: false,
        error: "online_payment_unavailable",
        message: "Online payments are not available.",
      },
      { status: 402 },
    );
  }

  const paymentAmount = information.paymentAmount ?? 0;
  const giftCards = information.giftCards;

  const { app, service } =
    await servicesContainer.connectedAppsService.getAppService<IPaymentProcessor>(
      paymentAppId,
    );

  const formProps = service.getFormProps(app);

  const intentUpdate = {
    amount: paymentAmount,
    appId: app._id,
    appName: app.name,
    request: modifyAppointmentRequest,
    customerId,
    type,
  } satisfies Omit<PaymentIntentUpdateModel, "status">;

  logger.debug(
    { intent: intentUpdate, isUpdating: !!intentId },
    "Creating or updating intent",
  );

  const intentResult = intentId
    ? await servicesContainer.paymentsService.updateIntent(intentId, {
        ...intentUpdate,
        status: "created",
      })
    : await servicesContainer.paymentsService.createIntent(intentUpdate);

  const { request: _, ...intent } = intentResult;

  logger.debug(
    { intent, isUpdating: !!intentId },
    "Successfully created or updated intent",
  );

  return NextResponse.json({
    formProps,
    intent,
    amount: paymentAmount,
    amountPaid: paymentAmount,
    amountTotal: paymentAmount,
    giftCards: giftCards?.map((giftCard) => ({
      code: giftCard.code,
      amountApplied: giftCard.appliedAmount,
    })),
  } satisfies CollectPayment);
};

export const createOrUpdateIntent = async (
  request: NextRequest,
  intentId?: string,
) => {
  const logger = getLoggerFactory("PaymentsUtils")("createOrUpdateIntent");
  const body = await request.json();

  logger.debug({ intentId }, "Creating or updating intent");

  const {
    success: createOrUpdatePaymentIntentRequestSuccess,
    data: createOrUpdatePaymentIntentRequest,
    error: createOrUpdatePaymentIntentRequestError,
  } = createOrUpdatePaymentIntentRequestSchema.safeParse(body);

  if (!createOrUpdatePaymentIntentRequestSuccess) {
    logger.error(
      { createOrUpdatePaymentIntentRequestError, body },
      "Invalid payment request",
    );

    return NextResponse.json(
      {
        error: createOrUpdatePaymentIntentRequestError,
        code: "invalid_request_format",
        success: false,
      },
      { status: 400 },
    );
  }

  logger.debug(
    { type: createOrUpdatePaymentIntentRequest.type, intentId },
    "Type",
  );

  if (
    createOrUpdatePaymentIntentRequest.type !== "rescheduleFee" &&
    createOrUpdatePaymentIntentRequest.type !== "cancellationFee"
  ) {
    return createOrUpdateAppointmentRequestIntent(
      createOrUpdatePaymentIntentRequest.request as AppointmentRequest,
      createOrUpdatePaymentIntentRequest.type,
      intentId,
    );
  }

  try {
    return await createOrUpdateModifyAppointmentRequestIntent(
      createOrUpdatePaymentIntentRequest.request,
      createOrUpdatePaymentIntentRequest.appointmentId,
      createOrUpdatePaymentIntentRequest.type,
      intentId,
    );
  } catch (error) {
    if (error instanceof CustomerSessionRequiredError) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    throw error;
  }
};
