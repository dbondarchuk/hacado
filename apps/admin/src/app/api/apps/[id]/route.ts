import { getServicesContainer, getUser } from "@/app/utils";
import {
  assertCanAccessConnectedApp,
  getOwnerMemberIds,
} from "@/lib/auth/app-access";
import { withCatalogTarget } from "@hacado/app-store/utils";
import { getLoggerFactory } from "@hacado/logger";
import { canUninstallConnectedApp } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/apps/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/apps/[id]")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      appId: id,
    },
    "Getting app by ID",
  );

  try {
    await assertCanAccessConnectedApp(id);
    const app = await servicesContainer.connectedAppsService.getApp(id);

    logger.debug(
      {
        appId: id,
        appName: app.name,
      },
      "Successfully retrieved app",
    );

    return NextResponse.json(app ?? null);
  } catch (error: any) {
    if (error?.status === 403) {
      return NextResponse.json(
        { success: false, error: "Forbidden", code: "forbidden" },
        { status: 403 },
      );
    }
    logger.error(
      {
        appId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to get app",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get app",
        code: "get_app_failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/apps/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/apps/[id]")("DELETE");
  const servicesContainer = await getServicesContainer();
  const user = await getUser();
  const { id } = await params;

  logger.debug(
    {
      appId: id,
    },
    "Deleting app",
  );

  try {
    const [app, ownerMemberIds] = await Promise.all([
      assertCanAccessConnectedApp(id, user),
      getOwnerMemberIds(),
    ]);
    if (
      !canUninstallConnectedApp(user, withCatalogTarget(app), ownerMemberIds)
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden", code: "forbidden" },
        { status: 403 },
      );
    }

    const result = await servicesContainer.connectedAppsService.deleteApp(id);

    if (result.success) {
      logger.debug({ appId: id, result }, "App deleted successfully");
    } else {
      logger.warn(
        { appId: id, result },
        "App delete blocked by uninstall check",
      );
    }

    return NextResponse.json(result, { status: result.success ? 200 : 405 });
  } catch (error: any) {
    if (error?.status === 403) {
      return NextResponse.json(
        { success: false, error: "Forbidden", code: "forbidden" },
        { status: 403 },
      );
    }
    logger.error(
      {
        appId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to delete app",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete app",
        code: "delete_app_failed",
      },
      { status: 500 },
    );
  }
}
