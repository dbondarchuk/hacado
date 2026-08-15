import { getServicesContainer } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { CustomerAuthError } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("API/customer-auth/verify-otp")("POST");
  const servicesContainer = await getServicesContainer();
  const authService = servicesContainer.customerAuthService;

  const json = await request.json();
  const email = typeof json.email === "string" ? json.email : undefined;
  const phone = typeof json.phone === "string" ? json.phone : undefined;
  const otp = typeof json.otp === "string" ? json.otp : "";

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    const result = await authService.verifyOtp({ email, phone, otp, ip });
    const response = NextResponse.json({
      success: true,
      name: result.name,
      email: result.email,
      phone: result.phone,
      id: result.id,
    });
    response.headers.append(
      "Set-Cookie",
      authService.getSessionCookieHeader(result.token),
    );
    logger.info({ customerId: result.id }, "OTP verified");
    return response;
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      logger.warn({ code: error.code }, "OTP verify failed");
      return NextResponse.json(
        { success: false, error: error.code },
        { status: error.status },
      );
    }
    throw error;
  }
}
