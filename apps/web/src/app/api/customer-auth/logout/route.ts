import { getServicesContainer } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { CUSTOMER_SESSION_COOKIE } from "@hacado/types";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const logger = getLoggerFactory("API/customer-auth/logout")("POST");
  const cookieStore = await cookies();
  const servicesContainer = await getServicesContainer();
  const authService = servicesContainer.customerAuthService;

  await authService.logout(cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value);
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);

  logger.debug({}, "Customer logged out");
  return NextResponse.json({ success: true });
}
