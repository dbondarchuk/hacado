import { getCustomerSessionFromRequest } from "@/utils/customer-auth/session";
import { getServicesContainer } from "@/utils/utils";
import type { AppLogger } from "@hacado/logger";
import type { AppointmentRequest } from "@hacado/types";
import { NextResponse } from "next/server";

export async function assertBookingCustomerAccess(
  request: AppointmentRequest,
  logger: AppLogger,
): Promise<NextResponse | null> {
  logger.debug("Asserting booking customer access");
  const servicesContainer = await getServicesContainer();
  const config =
    await servicesContainer.configurationService.getConfiguration("booking");
  const needsSession =
    !!config.requireCustomerOtp ||
    !!request.customerPackageId ||
    !!request.purchasePackageId;

  if (!needsSession) {
    logger.debug(
      {
        requireCustomerOtp: !!config.requireCustomerOtp,
        customerPackageId: !!request.customerPackageId,
        purchasePackageId: !!request.purchasePackageId,
      },
      "No customer session required",
    );
    return null;
  }

  const session = await getCustomerSessionFromRequest();
  if (!session) {
    logger.warn("Customer session not found");
    return NextResponse.json(
      {
        success: false,
        code: "otp_required",
        error: "Customer session required",
      },
      { status: 403 },
    );
  }

  const customer = await servicesContainer.customersService.getCustomer(
    session.customerId,
  );

  if (!customer) {
    logger.warn({ customerId: session.customerId }, "Customer not found");
    return NextResponse.json(
      { success: false, code: "otp_required" },
      { status: 403 },
    );
  }

  const email = request.fields.email.trim().toLowerCase();
  const phone = request.fields.phone.trim();
  if (
    customer.email?.trim().toLowerCase() !== email ||
    customer.phone?.trim() !== phone
  ) {
    logger.warn(
      { customerId: customer._id },
      "Customer contact details changed",
    );
    return NextResponse.json(
      {
        success: false,
        code: "otp_revalidation_required",
        error: "Contact details changed",
      },
      { status: 403 },
    );
  }

  logger.debug("Customer access granted");
  return null;
}
