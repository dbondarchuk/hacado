import { getActor, getServicesContainer, getSession } from "@/app/utils";
import { userUpdateSchema } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import type { SessionUser } from "@hacado/types";
import { canManageCalendarSources } from "@hacado/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const logger = getLoggerFactory("AdminAPI/users/me")("GET");
  logger.debug("Getting current member profile");
  const session = await getSession();
  if (!session) {
    logger.warn("Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.debug({ userId: session.user.id }, "Authorized");

  const servicesContainer = await getServicesContainer();
  const user = await servicesContainer.teamService.getMemberById(
    session.user.memberId,
  );
  if (!user) {
    logger.warn({ userId: session.user.id }, "Member profile not found");
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  logger.debug({ userId: session.user.id }, "Member profile found");
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const logger = getLoggerFactory("AdminAPI/users/me")("PATCH");
  logger.debug("Updating current member profile");
  const session = await getSession();
  if (!session) {
    logger.warn("Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error, success } = userUpdateSchema
    .partial()
    .safeParse(await request.json());

  if (!success) {
    logger.warn({ error }, "Invalid member profile update format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  const servicesContainer = await getServicesContainer();
  const booking =
    await servicesContainer.configurationService.getConfiguration("booking");
  const mayManageSources = canManageCalendarSources(
    session.user as SessionUser,
    {
      allowStaffCalendarSources: booking.allowStaffCalendarSources,
    },
  );

  const updatePayload = (() => {
    const withoutPhone = mayManageSources
      ? data
      : (() => {
          const { calendarSources: _calendarSources, ...rest } = data;
          return rest;
        })();
    // Phone changes require OTP via updateMyPhone - ignore phone on generic PATCH
    const { phone: _phone, ...rest } = withoutPhone;
    return rest;
  })();

  logger.debug({ data: updatePayload }, "Updating member profile fields");
  const actor = await getActor();
  await servicesContainer.teamService.updateMemberProfile(
    session.user.memberId,
    updatePayload,
    actor,
  );

  const user = await servicesContainer.teamService.getMemberById(
    session.user.memberId,
  );

  if (!user) {
    logger.warn({ userId: session.user.id }, "Member profile not found");
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  logger.debug({ userId: session.user.id }, "Member profile updated");
  return NextResponse.json(user);
}
