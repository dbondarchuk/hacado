import { getServicesContainer } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextResponse } from "next/server";

export async function GET() {
  const logger = getLoggerFactory("API/customer-auth/options")("GET");
  const servicesContainer = await getServicesContainer();
  const options = await servicesContainer.customerAuthService.getAuthOptions();
  logger.debug({ options }, "Returning customer auth options");
  return NextResponse.json({ success: true, ...options });
}
