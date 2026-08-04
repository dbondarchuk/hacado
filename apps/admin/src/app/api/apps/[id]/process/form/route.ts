import { getServicesContainer, getSession } from "@/app/utils";
import { assertCanAccessConnectedApp } from "@/lib/auth/app-access";
import { getLoggerFactory } from "@timelish/logger";
import { ConnectedAppRequestError } from "@timelish/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/apps/[id]/process/form">,
) {
  const logger = getLoggerFactory("AdminAPI/apps/[id]/process/form")("POST");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  const formData = await request.formData();

  logger.debug(
    {
      appId: id,
      hasData: !!formData,
    },
    "Processing app form request",
  );

  try {
    const session = await getSession();
    await assertCanAccessConnectedApp(id, session.user);
    const result =
      await servicesContainer.connectedAppsService.processFormRequest(
        id,
        formData,
        request,
        session.user,
      );

    logger.debug(
      {
        appId: id,
        hasData: !!formData,
      },
      "App form request processed",
    );

    return NextResponse.json(result ?? null);
  } catch (error: any) {
    logger.error(
      {
        appId: id,
        hasData: !!formData,
        error: error?.message || error?.toString(),
      },
      "Failed to process app form request",
    );

    if (error instanceof ConnectedAppRequestError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          data: error.data,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process app form request",
        code: "process_app_request_failed",
      },
      { status: 500 },
    );
  }
}
