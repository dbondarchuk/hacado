import { getLoggerFactory } from "@hacado/logger";
import {
  canUseFeature,
  resolvePlanTierFromOrganization,
} from "@hacado/services/billing";
import {
  AppointmentAddon,
  AppointmentDiscount,
  AppointmentEvent,
  AppointmentOption,
  AppointmentRequest,
  Customer,
  effectiveStaffDuration,
  effectiveStaffPrice,
} from "@hacado/types";
import { formatAmount, getDiscountAmount } from "@hacado/utils";
import { getServicesContainer } from "../utils";

export const getAppointmentEventFromRequest = async (
  request: AppointmentRequest,
  ignoreFieldValidation?: boolean,
  files?: Record<string, any>,
): Promise<
  | {
      event: AppointmentEvent;
      customer: Customer | null;
      option: AppointmentOption;
      addons: AppointmentEvent["addons"];
    }
  | {
      error: {
        code: string;
        message: string;
        status: number;
      };
    }
> => {
  const logger = getLoggerFactory("AppointmentsUtils")("getEvent");
  const servicesContainer = await getServicesContainer();

  logger.debug(
    {
      optionId: request.optionId,
      dateTime: request.dateTime,
      addonsCount: request.addonsIds?.length || 0,
      ignoreFieldValidation,
      hasFiles: !!files,
      fieldCount: Object.keys(request.fields).length,
    },
    "Processing appointment event from request",
  );

  const selectedOption = await servicesContainer.servicesService.getOption(
    request.optionId,
  );

  if (!selectedOption) {
    logger.warn({ optionId: request.optionId }, "Selected option not found");

    return {
      error: {
        code: "unknown_option",
        message: `Can't find option with id '${request.optionId}'`,
        status: 400,
      },
    };
  }

  logger.debug(
    {
      optionId: request.optionId,
      optionName: selectedOption.name,
      optionDurationType: selectedOption.durationType,
      optionIsOnline: selectedOption.isOnline,
      optionDuration:
        selectedOption.durationType === "fixed"
          ? selectedOption.duration
          : null,
      optionPrice:
        selectedOption.durationType === "fixed" ? selectedOption.price : null,
      optionPricePerHour:
        selectedOption.durationType === "flexible"
          ? selectedOption.pricePerHour
          : null,
    },
    "Retrieved selected option",
  );

  if (selectedOption.durationType === "flexible" && !request.duration) {
    logger.warn(
      { optionId: request.optionId, optionName: selectedOption.name },
      "Duration required but not provided",
    );

    return {
      error: {
        code: "duration_required",
        message: `Selected option requires the duration to be provided`,
        status: 400,
      },
    };
  } else if (
    selectedOption.durationType === "flexible" &&
    request.duration &&
    request.duration < selectedOption.durationMin
  ) {
    logger.warn(
      {
        optionId: request.optionId,
        optionName: selectedOption.name,
        duration: request.duration,
      },
      "Duration is less than the minimum duration",
    );

    return {
      error: {
        code: "duration_less_than_minimum",
        message: `Selected option requires the duration to be greater than the minimum duration`,
        status: 400,
      },
    };
  } else if (
    selectedOption.durationType === "flexible" &&
    request.duration &&
    request.duration > selectedOption.durationMax
  ) {
    logger.warn(
      {
        optionId: request.optionId,
        optionName: selectedOption.name,
        duration: request.duration,
      },
      "Duration is greater than the maximum duration",
    );

    return {
      error: {
        code: "duration_greater_than_maximum",
        message: `Selected option requires the duration to be less than the maximum duration`,
        status: 400,
      },
    };
  }

  let selectedAddons: AppointmentAddon[] | undefined = undefined;
  if (request.addonsIds) {
    logger.debug(
      { addonsIds: request.addonsIds },
      "Retrieving selected addons",
    );

    selectedAddons = await servicesContainer.servicesService.getAddonsById(
      request.addonsIds,
    );

    if (selectedAddons.length !== request.addonsIds.length) {
      logger.warn(
        {
          requestedAddonsCount: request.addonsIds.length,
          foundAddonsCount: selectedAddons.length,
          addonsIds: request.addonsIds,
        },
        "Some selected addons not found",
      );

      return {
        error: {
          code: "unknown_addon",
          message: `Can't find one or more selected addons`,
          status: 400,
        },
      };
    }

    logger.debug(
      {
        addonsCount: selectedAddons.length,
        addonNames: selectedAddons.map((a) => a.name),
      },
      "Successfully retrieved all selected addons",
    );
  }

  const allFields: Map<string, boolean> = new Map();
  for (const field of [
    ...(selectedOption.fields || []),
    ...(selectedAddons?.flatMap((addon) => addon.fields ?? []) || []),
  ]) {
    if (!allFields.has(field.id)) {
      allFields.set(field.id, !!field.required);
    } else {
      allFields.set(field.id, !!field.required || !!allFields.get(field.id));
    }
  }

  const fieldsIds = Array.from(allFields.keys());

  logger.debug(
    {
      fieldsCount: fieldsIds.length,
      requiredFieldsCount: Array.from(allFields.values()).filter(Boolean)
        .length,
    },
    "Calculated required fields from option and addons",
  );

  const serviceFields =
    await servicesContainer.servicesService.getFieldsById(fieldsIds);

  if (!ignoreFieldValidation) {
    logger.debug(
      { fieldValidationEnabled: true },
      "Validating required fields",
    );

    for (const field of serviceFields) {
      if (
        (field.required || allFields.get(field._id)) &&
        !files?.[field.name] &&
        !request.fields[field.name]
      ) {
        logger.warn(
          {
            fieldName: field.name,
            fieldId: field._id,
            fieldRequired: field.required,
            hasFile: !!files?.[field.name],
            hasFieldValue: !!request.fields[field.name],
          },
          "Required field validation failed",
        );

        return {
          error: {
            code: "field_required",
            message: `Field ${field.name} is required`,
            status: 400,
          },
        };
      }
    }

    logger.debug(
      { validatedFieldsCount: serviceFields.length },
      "Field validation completed successfully",
    );
  } else {
    logger.debug({ fieldValidationEnabled: false }, "Field validation skipped");
  }

  const staffAssignment = request.memberId
    ? selectedOption.staff?.find(
        (assignment) => assignment.memberId === request.memberId,
      )
    : undefined;

  if (request.memberId && selectedOption.staff?.length && !staffAssignment) {
    logger.warn(
      {
        optionId: request.optionId,
        memberId: request.memberId,
      },
      "Selected member is not assigned to this option",
    );

    return {
      error: {
        code: "unknown_member",
        message: `Selected specialist is not available for this option`,
        status: 400,
      },
    };
  }

  const optionDuration =
    selectedOption.durationType === "fixed"
      ? (effectiveStaffDuration(selectedOption.duration, staffAssignment) ?? 0)
      : (request.duration ?? 0);
  const totalDuration =
    (optionDuration ?? 0) +
    (selectedAddons?.reduce((sum, cur) => sum + (cur.duration ?? 0), 0) ?? 0);

  const optionPrice =
    selectedOption.durationType === "fixed"
      ? effectiveStaffPrice(selectedOption.price, staffAssignment)
      : ((effectiveStaffPrice(selectedOption.pricePerHour, staffAssignment) ||
          0) /
          60) *
        (optionDuration || 0);
  let totalPrice: number | undefined =
    (optionPrice ?? 0) +
    (selectedAddons?.reduce((sum, cur) => sum + (cur.price ?? 0), 0) ?? 0);

  logger.debug(
    {
      optionDurationType: selectedOption.durationType,
      optionDuration,
      requestDuration: request.duration,
      memberId: request.memberId,
      priceOverride: staffAssignment?.priceOverride,
      durationOverride: staffAssignment?.durationOverride,
      addonsDuration:
        selectedAddons?.reduce((sum, cur) => sum + (cur.duration ?? 0), 0) ?? 0,
      totalDuration,
      optionPrice: optionPrice,
      addonsPrice:
        selectedAddons?.reduce((sum, cur) => sum + (cur.price ?? 0), 0) ?? 0,
      totalPrice,
    },
    "Calculated duration and price",
  );

  let appointmentDiscount: AppointmentDiscount | undefined = undefined;

  logger.debug(
    {
      customerEmail: request.fields.email,
      customerPhone: request.fields.phone?.replace(
        /(\d{3})\d{3}(\d{4})/,
        "$1***$2",
      ),
    },
    "Looking up customer",
  );

  const customer = await servicesContainer.customersService.findCustomer(
    request.fields.email,
    request.fields.phone,
  );

  if (customer) {
    logger.debug(
      { customerId: customer._id, customerName: customer.name },
      "Found existing customer",
    );
  } else {
    logger.debug(
      { customerEmail: request.fields.email },
      "No existing customer found",
    );
  }

  if (request.promoCode) {
    const organization =
      await servicesContainer.organizationService.getOrganization();
    const planTier = resolvePlanTierFromOrganization(organization);
    if (!canUseFeature(planTier, "discounts")) {
      return {
        error: {
          code: "subscription_upgrade_required",
          message: "Discounts are not available on this plan.",
          status: 402,
        },
      };
    }

    logger.debug(
      {
        promoCode: request.promoCode,
        customerId: customer?._id,
        dateTime: request.dateTime,
      },
      "Applying promo code discount",
    );

    const discount = await servicesContainer.servicesService.applyDiscount({
      code: request.promoCode,
      dateTime: request.dateTime,
      optionId: request.optionId,
      addons: request.addonsIds,
      customerId: customer?._id,
    });

    if (!discount) {
      logger.warn({ promoCode: request.promoCode }, "Promo code not valid");

      return {
        error: {
          code: "promo_code_not_valid",
          message: `Promo code is not valid`,
          status: 400,
        },
      };
    }

    const discountAmount = getDiscountAmount(totalPrice, discount);
    appointmentDiscount = {
      code: request.promoCode,
      discountAmount,
      id: discount._id,
      name: discount.name,
    };

    totalPrice = Math.max(0, formatAmount(totalPrice - discountAmount));

    logger.debug(
      {
        promoCode: request.promoCode,
        discountName: discount.name,
        discountAmount,
        originalPrice: totalPrice + discountAmount,
        finalPrice: totalPrice,
      },
      "Successfully applied promo code discount",
    );
  }

  if (totalPrice === 0) totalPrice = undefined;

  const event: AppointmentEvent = {
    dateTime: request.dateTime,
    option: {
      _id: selectedOption._id,
      name: selectedOption.name,
      durationType: selectedOption.durationType,
      duration: optionDuration,
      price: optionPrice,
      isOnline: selectedOption.isOnline,
    },
    timeZone: request.timeZone,
    totalDuration,
    totalPrice,
    addons: selectedAddons?.map((addon) => ({
      _id: addon._id,
      name: addon.name,
      price: addon.price,
      duration: addon.duration,
    })),
    fields: request.fields,
    discount: appointmentDiscount,
    fieldsLabels: serviceFields.reduce(
      (map, field) => ({ ...map, [field.name]: field.data.label }),
      {} as Record<string, string>,
    ),
  };

  logger.info(
    {
      optionId: request.optionId,
      optionName: selectedOption.name,
      totalDuration,
      totalPrice,
      addonsCount: selectedAddons?.length || 0,
      hasDiscount: !!appointmentDiscount,
      customerId: customer?._id,
    },
    "Successfully created appointment event from request",
  );

  return {
    event,
    customer,
    option: selectedOption,
    addons: selectedAddons,
  };
};
