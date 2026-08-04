import { getServicesContainer, getSession } from "@/app/utils";
import { userUpdateSchema } from "@timelish/api-sdk";
import { getLoggerFactory } from "@timelish/logger";
import type { SessionUser } from "@timelish/types";
import { canManageCalendarSources } from "@timelish/utils";
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

  const updatePayload = mayManageSources
    ? data
    : (() => {
        const { calendarSources: _calendarSources, ...rest } = data;
        return rest;
      })();

  logger.debug({ data: updatePayload }, "Updating member profile fields");
  await servicesContainer.teamService.updateMemberProfile(
    session.user.memberId,
    updatePayload,
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
