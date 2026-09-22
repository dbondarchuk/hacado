import { getServicesContainer, getSession } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import { hasPermission } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/payments/payment-link/apps")("GET");
  const session = await getSession();
  const user = session?.user;

  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Listing payment-link apps",
  );

  if (!user?.id) {
    logger.warn("Unauthorized");
    return NextResponse.json(
      { success: false, code: "unauthorized", error: "Unauthorized" },
      { status: 401 },
    );
  }

  if (
    !hasPermission(user, "customer", "update") &&
    !hasPermission(user, "billing", "manage")
  ) {
    logger.warn({ role: user.role }, "Forbidden");
    return NextResponse.json(
      { success: false, code: "forbidden", error: "Forbidden" },
      { status: 403 },
    );
  }

  const servicesContainer = await getServicesContainer();
  const apps =
    await servicesContainer.connectedAppsService.getAppsByScope("payment-link");

  const items = apps.map((app) => ({
    _id: app._id,
    name: app.name,
  }));

  logger.debug({ count: items.length }, "Listed payment-link apps");

  return NextResponse.json({ items });
}
