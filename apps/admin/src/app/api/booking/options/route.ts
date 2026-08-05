import { getActor, getServicesContainer } from "@/app/utils";
import { getDefaultBookingConfiguration } from "@/components/install/default-booking";
import { BaseAllKeys } from "@hacado/i18n";
import { getLoggerFactory } from "@hacado/logger";
import { bookingConfigurationSchema, zObjectId } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("API/booking/options")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing booking options API request",
  );

  const response =
    await servicesContainer.bookingService.getAppointmentOptions();

  logger.debug(
    {
      optionsCount: response.options.length,
      showPromoCode: response.showPromoCode,
    },
    "Successfully retrieved booking options",
  );

  return NextResponse.json(response);
}

const addBookingAvailableOptionRequestSchema = z.object({
  optionId: zObjectId(
    "validation.configuration.booking.options.id.required" satisfies BaseAllKeys,
  ),
});

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/booking/options")("POST");

  const servicesContainer = await getServicesContainer();
  const actor = await getActor();

  const body = await request.json();
  const parsedBody = addBookingAvailableOptionRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    logger.warn({ error: parsedBody.error }, "Invalid request format");
    return NextResponse.json(
      {
        success: false,
        code: "invalid_request_format",
        error: parsedBody.error,
      },
      { status: 400 },
    );
  }

  logger.debug(
    { optionId: parsedBody.data.optionId },
    "Adding option to booking availability",
  );

  const { optionId } = parsedBody.data;
  const option = await servicesContainer.servicesService.getOption(optionId);
  if (!option) {
    logger.warn({ optionId }, "Option not found");
    return NextResponse.json(
      {
        success: false,
        code: "option_not_found",
        error: "Service option not found",
      },
      { status: 404 },
    );
  }

  const existingBooking =
    await servicesContainer.configurationService.getConfiguration("booking");
  const booking =
    existingBooking && Object.keys(existingBooking).length > 0
      ? existingBooking
      : getDefaultBookingConfiguration();

  const alreadyPresent = booking.options.some((item) => item.id === optionId);
  if (alreadyPresent) {
    logger.debug({ optionId }, "Option already present in booking options");
    return NextResponse.json({ success: true, alreadyPresent: true });
  }

  logger.debug({ optionId }, "Adding option to booking options");

  const updatedBooking = bookingConfigurationSchema.parse({
    ...booking,
    options: [...booking.options, { id: optionId }],
  });

  await servicesContainer.configurationService.setConfiguration(
    "booking",
    updatedBooking,
    actor,
  );

  logger.debug({ optionId }, "Added option to booking availability");
  return NextResponse.json({ success: true }, { status: 201 });
}
