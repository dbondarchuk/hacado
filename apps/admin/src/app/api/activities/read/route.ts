import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { okStatus } from "@hacado/types";
import { NextResponse } from "next/server";

export async function POST() {
  const auth = await requirePermission(
    "activity",
    "read",
    "AdminAPI/activities/read",
    "POST",
  );
  if (!auth.ok) return auth.response;

  const servicesContainer = await getServicesContainer();
  await servicesContainer.activityService.markActivityFeedRead(
    auth.user.memberId,
  );
  auth.logger.debug("Activity feed marked read");
  return NextResponse.json(okStatus, { status: 200 });
}
