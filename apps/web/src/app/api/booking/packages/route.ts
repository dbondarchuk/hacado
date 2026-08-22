import { getCustomerSessionFromRequest } from "@/utils/customer-auth/session";
import { getServicesContainer, sessionCanUseFeature } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const logger = getLoggerFactory("API/booking/packages")("GET");
  logger.debug("Processing packages API request");
  if (!(await sessionCanUseFeature("packages"))) {
    logger.warn("Packages are not available on this plan.");
    return NextResponse.json(
      {
        success: false,
        code: "subscription_upgrade_required",
        message: "Packages are not available on this plan.",
      },
      { status: 402 },
    );
  }

  const session = await getCustomerSessionFromRequest();
  if (!session) {
    logger.warn("Customer session not found");
    return NextResponse.json(
      { success: false, code: "otp_required" },
      { status: 403 },
    );
  }

  const servicesContainer = await getServicesContainer();
  const res = await servicesContainer.packagesService.getCustomerPackages({
    customerId: session.customerId,
    offset: 0,
    limit: 50,
  });

  logger.debug(
    { customerId: session.customerId, packages: res.items.length },
    "Packages API request processed successfully",
  );
  return NextResponse.json(res);
}
