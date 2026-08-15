import { getServicesContainer, getWebsiteUrl } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { Appointment, Customer } from "@hacado/types";
import { getAdminUrl, getArguments } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-cache";
export const revalidate = 10;

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/templates/arguments")("GET");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing templates arguments API request",
  );

  const params = request.nextUrl.searchParams;
  const appointmentId = params.get("appointmentId");
  const customerId = params.get("customerId");

  if (!appointmentId && !customerId) {
    logger.warn("Neither appointmentId nor customerId provided");
    return NextResponse.json(
      {
        code: "id_not_provided",
        error: "Neither appointmentId nor customerId provided",
        success: false,
      },
      { status: 400 },
    );
  }

  if (appointmentId && customerId) {
    logger.warn("Both appointmentId and customerId provided");
    return NextResponse.json(
      {
        code: "both_ids_provided",
        error: "Both appointmentId and customerId provided",
        success: false,
      },
      { status: 400 },
    );
  }

  logger.debug({ appointmentId, customerId }, "Fetching template arguments");

  const config = await servicesContainer.configurationService.getConfigurations(
    "booking",
    "general",
    "brand",
    "social",
  );

  let appointment: Appointment | null = null;
  let customer: Customer;

  if (appointmentId) {
    appointment =
      await servicesContainer.bookingService.getAppointment(appointmentId);
    if (!appointment) {
      logger.warn({ appointmentId }, "Appointment not found");
      return NextResponse.json(
        { error: "appointment_not_found" },
        { status: 404 },
      );
    }

    customer = appointment.customer;
  } else {
    const _customer = await servicesContainer.customersService.getCustomer(
      customerId!,
    );

    if (!_customer) {
      logger.warn({ customerId }, "Customer not found");
      return NextResponse.json(
        { error: "customer_not_found" },
        { status: 404 },
      );
    }

    customer = _customer;
  }

  const adminUrl = getAdminUrl();
  const websiteUrl = await getWebsiteUrl();
  const args = getArguments({
    appointment,
    config,
    customer,
    locale: config.brand.language,
    adminUrl,
    websiteUrl,
  });

  logger.debug(
    {
      appointmentId,
      customerId,
      argumentCount: Object.keys(args).length,
    },
    "Successfully retrieved template arguments",
  );

  return NextResponse.json(args);
}
