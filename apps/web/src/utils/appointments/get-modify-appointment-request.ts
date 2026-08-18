import { getLoggerFactory } from "@hacado/logger";
import {
  ApplyGiftCardsSuccessResponse,
  Appointment,
  CANCELLATION_NOT_ALLOWED_BY_POLICY_REASON,
  CANCELLATION_NOT_ALLOWED_REASON,
  CustomerSession,
  isClosedAppointmentStatus,
  MAX_RESCHEDULES_REACHED_REASON,
  ModifyAppointmentInformation,
  ModifyAppointmentInformationRequest,
  RESCHEDULE_NOT_ALLOWED_BY_POLICY_REASON,
  RESCHEDULE_NOT_ALLOWED_REASON,
  RESCHEDULED_APPOINTMENT_NOT_ALLOWED_REASON,
} from "@hacado/types";
import { formatAmount, getPolicyForRequest } from "@hacado/utils";
import { DateTime } from "luxon";
import { applyGiftCards } from "../gift-cards/apply";
import { getServicesContainer } from "../utils";

async function resolveAppointmentForModify(
  session: CustomerSession,
  request: ModifyAppointmentInformationRequest,
): Promise<Appointment | null> {
  const servicesContainer = await getServicesContainer();
  const logger = getLoggerFactory("AppointmentsUtils")(
    "resolveAppointmentForModify",
  );
  logger.debug({ request }, "Resolving appointment for modify");
  if (request.lookup === "appointmentId") {
    logger.debug(
      { appointmentId: request.appointmentId },
      "Getting appointment by id",
    );
    const appointment = await servicesContainer.bookingService.getAppointment(
      request.appointmentId,
    );

    if (!appointment) {
      logger.warn(
        { appointmentId: request.appointmentId },
        "Appointment not found",
      );
      return null;
    }

    if (appointment.customerId !== session.customerId) {
      logger.warn(
        {
          appointmentId: request.appointmentId,
          customerId: session.customerId,
          appointmentCustomerId: appointment.customerId,
        },
        "Appointment does not belong to the customer",
      );
      return null;
    }

    if (isClosedAppointmentStatus(appointment.status)) {
      logger.warn(
        { appointmentId: request.appointmentId },
        "Appointment is closed",
      );
      return null;
    }

    logger.debug({ appointmentId: request.appointmentId }, "Appointment found");
    return appointment;
  }

  return servicesContainer.bookingService.findAppointmentByCustomerAndDateTime(
    session.customerId,
    request.dateTime,
    ["confirmed", "pending"],
  );
}

async function applyGiftCardsToPaymentAmount(
  paymentAmount: number,
  giftCardCodes: string[] | undefined,
): Promise<
  | {
      paymentAmount: number;
      giftCards?: ApplyGiftCardsSuccessResponse["giftCards"];
    }
  | { error: { code: string; message: string; status: number } }
> {
  if (!giftCardCodes?.length) {
    return { paymentAmount };
  }
  const result = await applyGiftCards(giftCardCodes, paymentAmount);
  if (!result.success) {
    return {
      error: {
        code: result.code ?? "failed_to_apply_gift_cards",
        message: result.error ?? "Failed to apply gift cards",
        status: 400,
      },
    };
  }
  const totalApplied = result.giftCards.reduce(
    (sum, gc) => sum + gc.appliedAmount,
    0,
  );
  return {
    paymentAmount: Math.max(0, paymentAmount - totalApplied),
    giftCards: result.giftCards,
  };
}

export const getModifyAppointmentInformationRequestResult = async (
  request: ModifyAppointmentInformationRequest & { giftCards?: string[] },
  session: CustomerSession,
): Promise<
  | { information: ModifyAppointmentInformation; customerId: string }
  | { error: { code: string; message: string; status: number } }
> => {
  const logger = getLoggerFactory("AppointmentsUtils")(
    "getModifyAppointmentRequest",
  );

  logger.debug({ request }, "Finding appointment");

  const servicesContainer = await getServicesContainer();
  const appointment = await resolveAppointmentForModify(session, request);
  if (
    !appointment ||
    isClosedAppointmentStatus(appointment.status) ||
    appointment.dateTime < new Date()
  ) {
    logger.warn({ request }, "Appointment not found");
    return {
      error: {
        code: "appointment_not_found",
        message: "Appointment not found",
        status: 404,
      },
    };
  }

  logger.debug({ request }, "Appointment found");

  const config =
    await servicesContainer.configurationService.getConfiguration("booking");

  const option = await servicesContainer.servicesService.getOption(
    appointment.option._id,
  );

  const appointmentInformation = {
    type: request.type,
    id: appointment._id,
    name: appointment.customer?.name,
    optionName: appointment.option.name,
    addonsNames: appointment.addons?.map((addon) => addon.name),
    dateTime: appointment.dateTime,
    timeZone: appointment.timeZone,
    duration: appointment.totalDuration,
    price: appointment.totalPrice,
  };

  if (request.type === "cancel") {
    const hasDeposit = appointment.payments?.some(
      (payment) => payment.type === "deposit" && payment.status === "paid",
    );

    let featureConfig =
      config.cancellationsAndReschedules.cancellations[
        hasDeposit ? "withDeposit" : "withoutDeposit"
      ];

    const optionConfig =
      option?.cancellationPolicy?.[
        hasDeposit ? "withDeposit" : "withoutDeposit"
      ];
    if (optionConfig?.type === "custom") {
      logger.debug(
        { optionId: option?._id },
        "Option has custom cancellation policy. Using it instead of general configuration.",
      );
      featureConfig = optionConfig;
    }

    if (!featureConfig.enabled) {
      return {
        information: {
          ...appointmentInformation,
          allowed: false,
          reason: CANCELLATION_NOT_ALLOWED_REASON,
        },
        customerId: appointment.customerId,
      };
    }

    if (featureConfig.doNotAllowIfRescheduled) {
      const appointmentHistory =
        await servicesContainer.bookingService.getAppointmentHistory({
          appointmentId: appointment._id,
          type: "rescheduled",
          limit: 0, // we don't need to get history entries, we only need to check the total number of reschedules
        });

      if (appointmentHistory.total >= 1) {
        return {
          information: {
            ...appointmentInformation,
            allowed: false,
            reason: RESCHEDULED_APPOINTMENT_NOT_ALLOWED_REASON,
          },
          customerId: appointment.customerId,
        };
      }
    }

    const policy = getPolicyForRequest(
      featureConfig,
      appointment.dateTime,
      DateTime.now(),
    );

    if (!policy || policy.action === "notAllowed") {
      return {
        information: {
          ...appointmentInformation,
          allowed: false,
          reason: CANCELLATION_NOT_ALLOWED_BY_POLICY_REASON,
        },
        customerId: appointment.customerId,
      };
    }

    if (policy.action === "allowed") {
      return {
        information: {
          ...appointmentInformation,
          allowed: true,
          type: "cancel",
          action: "allowed",
        },
        customerId: appointment.customerId,
      };
    }

    if (hasDeposit && policy.action === "forfeitDeposit") {
      return {
        information: {
          ...appointmentInformation,
          allowed: true,
          type: "cancel",
          action: "forfeitDeposit",
        },
        customerId: appointment.customerId,
      };
    }

    if (
      hasDeposit &&
      (policy.action === "partialRefund" || policy.action === "fullRefund")
    ) {
      const refundPercentage =
        policy.action === "partialRefund"
          ? (policy.refundPercentage ?? 0)
          : policy.action === "fullRefund"
            ? 100
            : 0;

      const depositsPaidOnline = appointment.payments?.filter(
        (payment) =>
          payment.method === "online" &&
          payment.status === "paid" &&
          payment.type === "deposit",
      );

      const totalDepositsPaidOnline =
        depositsPaidOnline?.reduce((acc, payment) => acc + payment.amount, 0) ??
        0;

      const totalFeesPaidOnline =
        depositsPaidOnline?.reduce(
          (acc, payment) =>
            acc +
            (payment.fees?.reduce((acc, fee) => acc + fee.amount, 0) ?? 0),
          0,
        ) ?? 0;

      const totalRefundableAmount =
        totalDepositsPaidOnline -
        (!policy.refundFees ? totalFeesPaidOnline : 0);

      const refundAmount = totalDepositsPaidOnline
        ? formatAmount((refundPercentage * totalRefundableAmount) / 100)
        : 0;

      return {
        information: {
          ...appointmentInformation,
          allowed: true,
          action: "refund",
          refundPolicy: policy.action,
          refundPercentage: refundPercentage,
          refundAmount: refundAmount,
          refundFees: !!policy.refundFees,
          feesAmount: totalFeesPaidOnline,
          ...appointmentInformation,
          type: "cancel",
        },
        customerId: appointment.customerId,
      };
    }

    if (policy.action === "paymentToFullPriceRequired") {
      const originalPrice = policy.calculateFromOriginalPrice
        ? (appointment.totalPrice ?? 0) +
          (appointment.discount?.discountAmount ?? 0)
        : (appointment.totalPrice ?? 0);

      if (!originalPrice) {
        return {
          information: {
            ...appointmentInformation,
            allowed: false,
            reason: CANCELLATION_NOT_ALLOWED_BY_POLICY_REASON,
          },
          customerId: appointment.customerId,
        };
      }

      const deposits = appointment.payments?.filter(
        (payment) => payment.type === "deposit" && payment.status === "paid",
      );

      const totalDeposits =
        deposits?.reduce((acc, payment) => acc + payment.amount, 0) ?? 0;

      const paymentAmount = formatAmount(originalPrice - totalDeposits);

      const giftCardResult = await applyGiftCardsToPaymentAmount(
        paymentAmount,
        request.giftCards,
      );
      if ("error" in giftCardResult) return giftCardResult;

      return {
        information: {
          ...appointmentInformation,
          allowed: true,
          action: "payment",
          paymentPolicy: policy.action,
          paymentAmount: giftCardResult.paymentAmount,
          giftCards: giftCardResult.giftCards,
          ...appointmentInformation,
          type: "cancel",
        },
        customerId: appointment.customerId,
      };
    }

    if (policy.action === "paymentRequired") {
      if (policy.paymentType === "amount") {
        const giftCardResult = await applyGiftCardsToPaymentAmount(
          policy.paymentAmount,
          request.giftCards,
        );
        if ("error" in giftCardResult) return giftCardResult;

        return {
          information: {
            ...appointmentInformation,
            allowed: true,
            action: "payment",
            paymentPolicy: policy.action,
            paymentAmount: giftCardResult.paymentAmount,
            giftCards: giftCardResult.giftCards,
            ...appointmentInformation,
            type: "cancel",
          },
          customerId: appointment.customerId,
        };
      }

      const originalPrice = policy.calculateFromOriginalPrice
        ? (appointment.totalPrice ?? 0) +
          (appointment.discount?.discountAmount ?? 0)
        : (appointment.totalPrice ?? 0);

      if (!originalPrice) {
        return {
          information: {
            ...appointmentInformation,
            allowed: false,
            reason: CANCELLATION_NOT_ALLOWED_BY_POLICY_REASON,
          },
          customerId: appointment.customerId,
        };
      }

      const paymentAmount = formatAmount(
        (originalPrice * (policy.paymentPercentage ?? 100)) / 100,
      );

      const giftCardResult = await applyGiftCardsToPaymentAmount(
        paymentAmount,
        request.giftCards,
      );
      if ("error" in giftCardResult) return giftCardResult;

      return {
        information: {
          ...appointmentInformation,
          allowed: true,
          action: "payment",
          paymentPolicy: policy.action,
          paymentAmount: giftCardResult.paymentAmount,
          giftCards: giftCardResult.giftCards,
          ...appointmentInformation,
          type: "cancel",
        },
        customerId: appointment.customerId,
      };
    } else {
      return {
        information: {
          ...appointmentInformation,
          allowed: false,
          reason: CANCELLATION_NOT_ALLOWED_BY_POLICY_REASON,
        },
        customerId: appointment.customerId,
      };
    }
  } else if (request.type === "reschedule") {
    let featureConfig = config.cancellationsAndReschedules.reschedules;
    const optionConfig = option?.reschedulePolicy;
    if (optionConfig?.type === "custom") {
      logger.debug(
        { optionId: option?._id },
        "Option has custom reschedule policy. Using it instead of general configuration.",
      );
      featureConfig = optionConfig;
    }

    if (!featureConfig.enabled) {
      return {
        information: {
          ...appointmentInformation,
          allowed: false,
          reason: RESCHEDULE_NOT_ALLOWED_REASON,
        },
        customerId: appointment.customerId,
      };
    }

    // if (
    //   featureConfig.enabled === "notAllowedWithoutDeposit" &&
    //   !appointment.payments?.some(
    //     (payment) => payment.type === "deposit" && payment.status === "paid",
    //   )
    // ) {
    //   return {
    //     information: {
    //       ...appointmentInformation,
    //       allowed: false,
    //       reason: "original_appointment_deposit_required",
    //     },
    //     customerId: appointment.customerId,
    //   };
    // }

    if (featureConfig.maxReschedules) {
      const appointmentHistory =
        await servicesContainer.bookingService.getAppointmentHistory({
          appointmentId: appointment._id,
          type: "rescheduled",
          limit: 0, // we don't need to get history entries, we only need to check the total number of reschedules
        });

      if (appointmentHistory.total >= featureConfig.maxReschedules) {
        return {
          information: {
            ...appointmentInformation,
            allowed: false,
            reason: MAX_RESCHEDULES_REACHED_REASON,
          },
          customerId: appointment.customerId,
        };
      }
    }

    const policy = getPolicyForRequest(
      featureConfig,
      appointment.dateTime,
      DateTime.now(),
    );

    if (!policy || policy.action === "notAllowed") {
      return {
        information: {
          ...appointmentInformation,
          allowed: false,
          reason: RESCHEDULE_NOT_ALLOWED_BY_POLICY_REASON,
        },
        customerId: appointment.customerId,
      };
    }

    if (policy.action === "allowed") {
      return {
        information: {
          ...appointmentInformation,
          allowed: true,
          action: policy.action,
          ...appointmentInformation,
          type: "reschedule",
          timeZone: appointment.timeZone,
        },
        customerId: appointment.customerId,
      };
    }

    if (policy.action === "paymentRequired") {
      if (policy.paymentType === "amount") {
        const giftCardResult = await applyGiftCardsToPaymentAmount(
          policy.paymentAmount,
          request.giftCards,
        );
        if ("error" in giftCardResult) return giftCardResult;

        return {
          information: {
            ...appointmentInformation,
            allowed: true,
            action: "paymentRequired",
            paymentAmount: giftCardResult.paymentAmount,
            giftCards: giftCardResult.giftCards,
            ...appointmentInformation,
            type: "reschedule",
            timeZone: appointment.timeZone,
          },
          customerId: appointment.customerId,
        };
      }

      const originalPrice = policy.calculateFromOriginalPrice
        ? (appointment.totalPrice ?? 0) +
          (appointment.discount?.discountAmount ?? 0)
        : (appointment.totalPrice ?? 0);

      if (!originalPrice) {
        return {
          information: {
            ...appointmentInformation,
            allowed: false,
            reason: RESCHEDULE_NOT_ALLOWED_BY_POLICY_REASON,
          },
          customerId: appointment.customerId,
        };
      }

      const paymentAmount = formatAmount(
        (originalPrice * (policy.paymentPercentage ?? 100)) / 100,
      );

      const giftCardResult = await applyGiftCardsToPaymentAmount(
        paymentAmount,
        request.giftCards,
      );
      if ("error" in giftCardResult) return giftCardResult;

      return {
        information: {
          allowed: true,
          action: policy.action,
          paymentAmount: giftCardResult.paymentAmount,
          giftCards: giftCardResult.giftCards,
          ...appointmentInformation,
          type: "reschedule",
          timeZone: appointment.timeZone,
        },
        customerId: appointment.customerId,
      };
    }
  }

  logger.warn({ request }, "Invalid request type");
  return {
    error: {
      code: "invalid_request_type",
      message: "Invalid request type",
      status: 400,
    },
  };
};
