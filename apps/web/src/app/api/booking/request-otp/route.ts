import { trackBookingStep } from "@/utils/booking-tracking";
import { getServicesContainer } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { CustomerAuthError } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("API/booking/request-otp")("POST");
  logger.debug("Processing booking request OTP API request");
  const servicesContainer = await getServicesContainer();
  const json = await request.json();
  const name = typeof json.name === "string" ? json.name : "";
  const email = typeof json.email === "string" ? json.email : undefined;
  const phone = typeof json.phone === "string" ? json.phone : undefined;
  const channel =
    json.channel === "email" || json.channel === "phone"
      ? json.channel
      : undefined;
  const existingOnly = json.existingOnly === true;

  if (!email && !phone) {
    logger.warn("Invalid request format: no email or phone");
    return NextResponse.json(
      {
        success: false,
        error: "invalid_request_format",
        message: "No email or phone provided",
      },
      { status: 400 },
    );
  }

  if (channel === "email" && !email) {
    logger.warn("Invalid request format: no email");
    return NextResponse.json(
      {
        success: false,
        error: "invalid_request_format",
        message: "No email provided",
      },
      { status: 400 },
    );
  }

  if (channel === "phone" && !phone) {
    logger.warn("Invalid request format: no phone");
    return NextResponse.json(
      { success: false, error: "invalid_request_format" },
      { status: 400 },
    );
  }

  // Package redeem verification is for existing customers only - never create/update.
  // Payment OTP may still upsert so first-time bookers can verify contact details.
  if (!existingOnly) {
    if (!name.trim()) {
      logger.warn("Invalid request format: no name");
      return NextResponse.json(
        {
          success: false,
          error: "invalid_request_format",
          message: "No name provided",
        },
        { status: 400 },
      );
    }

    logger.debug("Getting or upserting customer");
    await servicesContainer.customersService.getOrUpsertCustomer(
      {
        name: name.trim(),
        email: email ?? "",
        phone: phone ?? "",
      },
      { actor: "customer" },
    );
    logger.debug("Customer upserted");
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const otpPayload =
    channel === "phone"
      ? { phone }
      : channel === "email"
        ? { email }
        : { email, phone };

  try {
    const result = await servicesContainer.customerAuthService.requestOtp(
      otpPayload,
      ip,
    );
    await trackBookingStep(request, "OTP_REQUESTED", {
      customerEmail: email,
      customerName: name || undefined,
    });
    logger.debug("OTP request processed successfully");
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CustomerAuthError) {
      logger.warn(
        { code: error.code, message: error.message },
        "Booking OTP request failed",
      );
      return NextResponse.json(
        { success: false, error: error.code },
        { status: error.status },
      );
    }
    throw error;
  }
}
