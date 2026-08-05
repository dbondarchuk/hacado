import { getLoggerFactory } from "@hacado/logger";
import {
  ApplyGiftCardsSuccessResponse,
  AppointmentEvent,
  AppointmentOption,
  AppointmentRequest,
  Customer,
  IServicesContainer,
} from "@hacado/types";
import { formatAmount } from "@hacado/utils";
import { applyGiftCards } from "../gift-cards/apply";
import { getServicesContainer, sessionCanUseFeature } from "../utils";
import { getAppointmentEventFromRequest } from "./get-event";

type GetIsPaymentRequiredReturnType =
  | {
      amount: number;
      amountPaid: number;
      amountTotal: number;
      percentage: number;
      appId: string;
      option: AppointmentOption;
      customer: Customer | null;
      event: AppointmentEvent;
      isPaymentRequired: true;
      giftCards?: ApplyGiftCardsSuccessResponse["giftCards"];
      isFixedAmount: boolean;
    }
  | {
      error: {
        code: string;
        message: string;
        status: number;
      };
    }
  | {
      customer: Customer | null;
      event: AppointmentEvent;
      isPaymentRequired: false;
      giftCards?: ApplyGiftCardsSuccessResponse["giftCards"];
    };

export const getAppointmentEventAndIsPaymentRequired = async (
  appointmentRequest: AppointmentRequest,
  ignoreFieldValidation?: boolean,
  files?: Record<string, any>,
): Promise<GetIsPaymentRequiredReturnType> => {
  const logger = getLoggerFactory("AppointmentsUtils")("getPaymentRequired");

  logger.debug(
    {
      optionId: appointmentRequest.optionId,
      dateTime: appointmentRequest.dateTime,
      addonsCount: appointmentRequest.addonsIds?.length || 0,
      ignoreFieldValidation,
      hasFiles: !!files,
      fieldCount: Object.keys(appointmentRequest.fields).length,
    },
    "Processing appointment event and payment requirement",
  );

  const eventOrError = await getAppointmentEventFromRequest(
    appointmentRequest,
    ignoreFieldValidation,
    files,
  );

  if ("error" in eventOrError) {
    logger.warn(
      {
        optionId: appointmentRequest.optionId,
        errorCode: eventOrError.error.code,
        errorMessage: eventOrError.error.message,
      },
      "Failed to create appointment event, returning error",
    );

    return { error: eventOrError.error };
  }

  const { event, option, customer } = eventOrError;

  logger.debug(
    {
      optionId: option._id,
      optionName: option.name,
      totalPrice: event.totalPrice,
      customerId: customer?._id,
      customerName: customer?.name,
    },
    "Successfully created appointment event, checking payment requirement",
  );

  if (!event.totalPrice) {
    logger.debug(
      { optionId: option._id, optionName: option.name },
      "No total price, payment not required",
    );

    return {
      event,
      customer,
      isPaymentRequired: false,
    };
  }

  const canUsePayments = await sessionCanUseFeature("payments");
  if (!canUsePayments) {
    logger.debug(
      { optionId: option._id, optionName: option.name },
      "Payments are not available on this plan, payment not required",
    );

    return {
      event,
      customer,
      isPaymentRequired: false,
    };
  }

  let totalPaid = 0;
  let giftCards: ApplyGiftCardsSuccessResponse["giftCards"] = [];
  if (appointmentRequest.giftCards?.length) {
    logger.debug(
      { giftCards: appointmentRequest.giftCards },
      "Gift cards applied, subtracting from total price",
    );

    const giftCardsResponse = await applyGiftCards(
      appointmentRequest.giftCards,
      event.totalPrice,
    );

    if (giftCardsResponse.success) {
      giftCards = giftCardsResponse.giftCards;
      totalPaid += giftCardsResponse.giftCards.reduce(
        (sum, giftCard) => sum + giftCard.appliedAmount,
        0,
      );
    } else {
      logger.warn(
        { error: giftCardsResponse.error },
        "Failed to apply gift cards, returning error",
      );

      return {
        error: {
          code: "failed_to_apply_gift_cards",
          status: 400,
          message: "Failed to apply gift cards",
        },
      };
    }
  }

  logger.debug(
    { totalPrice: event.totalPrice },
    "Total price exists, checking payment configuration",
  );

  if (customer?.dontAllowBookings) {
    logger.warn(
      {
        optionId: option._id,
        optionName: option.name,
        customerId: customer._id,
        customerName: customer.name,
      },
      "Customer is not allowed to book appointments. Returning error.",
    );

    return {
      error: {
        code: "customer_not_allowed_to_book",
        status: 405,
        message: "Customer is not allowed to book appointments",
      },
    };
  }

  const servicesContainer = await getServicesContainer();
  const { booking: config, defaultApps } =
    await servicesContainer.configurationService.getConfigurations(
      "booking",
      "defaultApps",
    );
  const paymentAppId = defaultApps?.paymentAppId;

  const customersPriorAppointmentsCount =
    await getCustomerCompletedAppointments(servicesContainer, customer?._id);

  logger.debug(
    {
      customersPriorAppointmentsCount,
      paymentsEnabled: config.payments?.enabled,
      paymentAppId: config.payments?.enabled ? paymentAppId : undefined,
      requireDeposit:
        config.payments?.enabled && "requireDeposit" in config.payments
          ? config.payments.requireDeposit
          : undefined,
      depositPercentage:
        config.payments?.enabled && "depositPercentage" in config.payments
          ? config.payments.depositPercentage
          : undefined,
      dontRequireIfCompletedMinNumberOfAppointments:
        config.payments?.enabled && config.payments.requireDeposit
          ? config.payments.dontRequireIfCompletedMinNumberOfAppointments
          : undefined,
    },
    "Retrieved booking configuration",
  );

  if (config.payments?.enabled && paymentAppId) {
    logger.debug(
      { paymentAppId },
      "Payments enabled, determining deposit requirement",
    );

    let percentage: number | null = null;
    let isFixedAmount: boolean = false;

    if (customer?.requireDeposit === "always" && customer.depositPercentage) {
      percentage = customer.depositPercentage;
      logger.debug(
        {
          customerId: customer._id,
          customerName: customer.name,
          customerDepositPercentage: customer.depositPercentage,
          reason: "customer_always_require_deposit",
        },
        "Customer requires deposit",
      );
    } else if (customer?.requireDeposit === "never") {
      logger.debug(
        {
          customerId: customer._id,
          customerName: customer.name,
          reason: "customer_never_require_deposit",
        },
        "Customer never requires deposit",
      );

      return {
        event,
        giftCards,
        customer,
        isPaymentRequired: false,
      };
    } else if (
      customer &&
      config.payments.requireDeposit &&
      "depositPercentage" in config.payments &&
      config.payments.depositPercentage &&
      config.payments.dontRequireIfCompletedMinNumberOfAppointments &&
      customersPriorAppointmentsCount >=
        config.payments.dontRequireIfCompletedMinNumberOfAppointments
    ) {
      logger.debug(
        {
          customerId: customer._id,
          customerName: customer.name,
          customersPriorAppointmentsCount,
          reason: "customer_has_enough_appointments",
        },
        "Customer has enough appointments to not require deposit",
      );

      return {
        event,
        giftCards,
        customer,
        isPaymentRequired: false,
      };
    } else if (option.requireDeposit === "always") {
      if (option.paymentType === "percentage") {
        percentage = option.depositPercentage;
      } else {
        let amount = option.depositAmount;
        isFixedAmount = true;
        if (amount > event.totalPrice) {
          logger.debug(
            {
              amount,
              totalPrice: event.totalPrice,
              reason: "option_amount_greater_than_total_price",
            },
            "Option amount is greater than total price, setting to total price",
          );
          amount = event.totalPrice;
          percentage = 100;
        } else {
          percentage = formatAmount((amount / event.totalPrice) * 100);
        }
      }

      logger.debug(
        {
          optionId: option._id,
          optionName: option.name,
          optionDepositPercentage: percentage,
          paymentType: option.paymentType,
          reason: "option_always_require_deposit",
        },
        "Option requires deposit",
      );
    } else if (option.requireDeposit === "never") {
      percentage = null;
      logger.debug(
        {
          optionId: option._id,
          optionName: option.name,
          reason: "option_never_require_deposit",
        },
        "Option never requires deposit",
      );
    } else if (
      config.payments.requireDeposit &&
      "depositPercentage" in config.payments &&
      config.payments.depositPercentage
    ) {
      percentage = config.payments.depositPercentage;
      logger.debug(
        {
          configDepositPercentage: config.payments.depositPercentage,
          reason: "config_require_deposit",
        },
        "Configuration requires deposit",
      );
    }

    if (percentage !== null) {
      let totalAmount = formatAmount((event.totalPrice * percentage) / 100);
      if (
        config.payments.fullPaymentAmountThreshold &&
        totalAmount < config.payments.fullPaymentAmountThreshold
      ) {
        logger.debug(
          {
            fullPaymentAmountThreshold:
              config.payments.fullPaymentAmountThreshold,
            amount: totalAmount,
            reason: "amount_less_than_full_payment_amount_threshold",
          },
          "Amount is less than full payment amount threshold, setting to full payment",
        );

        totalAmount = event.totalPrice;
        percentage = 100;
      }

      logger.info(
        {
          optionId: option._id,
          optionName: option.name,
          totalPrice: event.totalPrice,
          depositPercentage: percentage,
          depositAmount: totalAmount,
          paymentAppId,
          customerId: customer?._id,
        },
        "Payment required with deposit",
      );

      if (totalAmount > event.totalPrice) {
        logger.debug(
          {
            amount: totalAmount,
            totalPrice: event.totalPrice,
            reason: "amount_greater_than_total_price",
          },
          "Amount is greater than total price, setting to total price",
        );
        totalAmount = event.totalPrice;
        percentage = 100;
      }

      const amount = Math.max(0, totalAmount - totalPaid);

      if (amount === 0) {
        logger.debug(
          {
            totalPaid,
            amount: totalAmount,
            reason: "total_paid_greater_than_amount",
          },
          "Total paid is greater than amount, no payment required",
        );

        return {
          event,
          giftCards,
          customer,
          isPaymentRequired: false,
        };
      } else {
        logger.debug(
          {
            totalPaid,
            amount: totalAmount,
            reason: "total_paid_less_than_amount",
          },
          "Total paid is less than amount, payment required",
        );
      }

      return {
        event,
        amount,
        amountPaid: totalPaid,
        amountTotal: totalAmount,
        percentage,
        appId: paymentAppId,
        isFixedAmount,
        giftCards,
        option,
        customer,
        isPaymentRequired: true,
      };
    } else {
      logger.debug(
        {
          optionId: option._id,
          optionName: option.name,
          reason: "no_deposit_percentage_determined",
        },
        "No deposit percentage determined, payment not required",
      );
    }
  } else {
    logger.debug(
      {
        paymentsEnabled: config.payments?.enabled,
        hasPaymentAppId: !!(config.payments?.enabled && paymentAppId),
        reason: "payments_disabled_or_no_app_id",
      },
      "Payments disabled or no payment app configured",
    );
  }

  logger.info(
    {
      optionId: option._id,
      optionName: option.name,
      totalPrice: event.totalPrice,
      customerId: customer?._id,
    },
    "Payment not required for appointment",
  );

  return {
    event,
    giftCards,
    customer,
    isPaymentRequired: false,
  };
};

const getCustomerCompletedAppointments = async (
  servicesContainer: IServicesContainer,
  customerId?: string,
) => {
  if (!customerId) return 0;
  const result = await servicesContainer.bookingService.getAppointments({
    customerId: customerId,
    limit: 0,
    status: ["confirmed"],
    endRange: {
      end: new Date(),
    },
  });

  return result.total;
};
