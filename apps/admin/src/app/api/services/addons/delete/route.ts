import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { bulkDeleteSchema } from "@timelish/api-sdk";
import { okStatus } from "@timelish/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(
    "service",
    "delete",
    "AdminAPI/services/addons/delete",
    "POST",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const body = await request.json();

  logger.debug(
    {
      addonIds: body.ids,
      count: body.ids?.length || 0,
    },
    "Processing bulk delete service addons request",
  );

  const { data, error, success } = bulkDeleteSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid bulk delete request format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  try {
    await servicesContainer.servicesService.deleteAddons(data.ids, actor);

    logger.debug(
      {
        addonIds: data.ids,
        count: data.ids.length,
      },
      "Service addons deleted successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        addonIds: data.ids,
        count: data.ids.length,
        error: error?.message || error?.toString(),
      },
      "Failed to delete service addons",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete service addons",
        code: "delete_service_addons_failed",
      },
      { status: 500 },
    );
  }
}
