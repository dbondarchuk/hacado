import { getServicesContainer, getSession } from "@/app/utils";
import { getAccessibleConnectedApps } from "@/lib/auth/app-access";
import { sessionCanInstallApp } from "@/lib/billing/subscription-plan-access";
import { AvailableApps } from "@timelish/app-store";
import { getLoggerFactory } from "@timelish/logger";
import { BRAND_SETTINGS_UPGRADE_URL } from "@timelish/services/billing";
import type { SessionUser } from "@timelish/types";
import { canInstallApp } from "@timelish/utils";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

export const dynamic = "force-dynamic";

const createAppSchema = z.object({
  type: z.string("App type is required").min(1, "App type is required"),
});

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/apps")("GET");
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing apps API request",
  );

  try {
    const apps = await getAccessibleConnectedApps();

    logger.debug(
      {
        count: apps.length,
      },
      "Successfully retrieved apps",
    );

    return NextResponse.json(apps);
  } catch (error: any) {
    logger.error(
      {
        error: error?.message || error?.toString(),
      },
      "Failed to get apps",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get apps",
        code: "get_apps_failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/apps")("POST");
  const body = await request.json();
  const servicesContainer = await getServicesContainer();
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "unauthorized" },
      { status: 401 },
    );
  }

  logger.debug(
    {
      appType: body.type,
    },
    "Creating new app",
  );

  const { data, error, success } = createAppSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid app creation request format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  const appDefinition = AvailableApps[data.type];
  if (!appDefinition || appDefinition.isHidden) {
    return NextResponse.json(
      { success: false, error: "Unknown app", code: "unknown_app" },
      { status: 404 },
    );
  }

  if (!canInstallApp(session.user as SessionUser, appDefinition)) {
    return NextResponse.json(
      { success: false, error: "Forbidden", code: "forbidden" },
      { status: 403 },
    );
  }

  if (!sessionCanInstallApp(session, data.type)) {
    return NextResponse.json(
      {
        success: false,
        code: "subscription_upgrade_required",
        message: "This app requires a Solo subscription.",
        settingsUrl: BRAND_SETTINGS_UPGRADE_URL,
      },
      { status: 402 },
    );
  }

  try {
    const appId = await servicesContainer.connectedAppsService.createNewApp(
      data.type,
      session.user.memberId,
    );

    logger.debug(
      {
        appType: data.type,
        appId,
      },
      "New app created successfully",
    );

    return NextResponse.json(appId, { status: 201 });
  } catch (error: any) {
    logger.error(
      {
        appType: data.type,
        error: error?.message || error?.toString(),
      },
      "Failed to create app",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create app",
        code: "create_app_failed",
      },
      { status: 500 },
    );
  }
}
