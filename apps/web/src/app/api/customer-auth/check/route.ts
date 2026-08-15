import { getCustomerSessionFromRequest } from "@/utils/customer-auth/session";
import { getServicesContainer } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextResponse } from "next/server";

export async function GET() {
  const logger = getLoggerFactory("API/customer-auth/check")("GET");
  const session = await getCustomerSessionFromRequest();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const servicesContainer = await getServicesContainer();
  const customer = await servicesContainer.customersService.getCustomer(
    session.customerId,
  );

  if (!customer) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  logger.debug({ customerId: session.customerId }, "Session valid");
  return NextResponse.json({
    success: true,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    id: customer._id,
  });
}
