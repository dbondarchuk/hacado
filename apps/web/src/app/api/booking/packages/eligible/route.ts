import { getCustomerSessionFromRequest } from "@/utils/customer-auth/session";
import { getServicesContainer, sessionCanUseFeature } from "@/utils/utils";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("API/booking/packages/eligible")("GET");
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

  const optionId = request.nextUrl.searchParams.get("optionId") ?? "";
  const memberId = request.nextUrl.searchParams.get("memberId") ?? "";
  const dateTimeRaw = request.nextUrl.searchParams.get("dateTime");
  const appointmentDate = dateTimeRaw ? new Date(dateTimeRaw) : new Date();

  logger.debug(
    { optionId, memberId, dateTime: dateTimeRaw },
    "Processing packages eligible API request",
  );

  const servicesContainer = await getServicesContainer();
  const option = await servicesContainer.servicesService.getOption(optionId);
  const optionStaffMemberIds = (option?.staff ?? []).map((s) => s.memberId);

  const items = await servicesContainer.packagesService.findEligible({
    customerId: session.customerId,
    optionId,
    memberId,
    appointmentDate,
    optionStaffMemberIds,
  });

  logger.debug(
    {
      customerId: session.customerId,
      optionId,
      memberId,
      dateTime: dateTimeRaw,
      items: items.length,
    },
    "Packages eligible API request processed successfully",
  );

  return NextResponse.json({ items });
}
