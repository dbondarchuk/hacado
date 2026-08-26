import { trackBookingStep } from "@/utils/booking-tracking";
import { getLoggerFactory } from "@hacado/logger";
import {
  BookingTrackingMetadata,
  isClientTrackableBookingStep,
} from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

function parseClientTrackingMetadata(
  raw: unknown,
): BookingTrackingMetadata | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const src = raw as Record<string, unknown>;
  const metadata: BookingTrackingMetadata = {};

  if (typeof src.optionId === "string") metadata.optionId = src.optionId;
  if (typeof src.memberId === "string") metadata.memberId = src.memberId;
  if (typeof src.duration === "number" && Number.isFinite(src.duration)) {
    metadata.duration = src.duration;
  }
  if (typeof src.isPaymentRequired === "boolean") {
    metadata.isPaymentRequired = src.isPaymentRequired;
  }
  if (
    typeof src.paymentAmount === "number" &&
    Number.isFinite(src.paymentAmount)
  ) {
    metadata.paymentAmount = src.paymentAmount;
  }
  if (typeof src.customerEmail === "string") {
    metadata.customerEmail = src.customerEmail;
  }
  if (typeof src.customerName === "string") {
    metadata.customerName = src.customerName;
  }
  if (typeof src.error === "string") metadata.error = src.error.slice(0, 200);

  return Object.keys(metadata).length ? metadata : undefined;
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("API/booking/tracking")("POST");

  const json = await request.json().catch(() => null);
  const step = typeof json?.step === "string" ? json.step : "";
  if (!isClientTrackableBookingStep(step)) {
    logger.warn({ step }, "Rejected booking tracking step");
    return NextResponse.json(
      { success: false, error: "invalid_step" },
      { status: 400 },
    );
  }

  await trackBookingStep(
    request,
    step,
    parseClientTrackingMetadata(json?.metadata),
    step === "PAYMENT_SUCCESS" || step === "PAYMENT_FAILED"
      ? { createIfMissing: false }
      : undefined,
  );

  return NextResponse.json({ success: true });
}
