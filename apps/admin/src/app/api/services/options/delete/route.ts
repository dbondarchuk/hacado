import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { bulkDeleteSchema } from "@hacado/api-sdk";
import { okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(
    "service",
    "delete",
    "AdminAPI/services/options/delete",
    "POST",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const servicesContainer = await getServicesContainer();
  const actor = await getActor();
  logger.debug(
    {
      url: request.url,
      method: request.method,
    },
    "Processing service options bulk delete request",
  );

  const body = await request.json();

  const { data, error, success } = bulkDeleteSchema.safeParse(body);
  if (!success) {
    logger.warn({ error }, "Invalid bulk delete request format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug(
    {
      ids: data.ids,
    },
    "Deleting service options",
  );

  try {
    await servicesContainer.servicesService.deleteOptions(data.ids, actor);

    logger.debug(
      {
        ids: data.ids,
      },
      "Service options deleted successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        ids: data.ids,
        error: error?.message || error?.toString(),
      },
      "Failed to delete service options",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete service options",
        code: "delete_service_options_failed",
      },
      { status: 500 },
    );
  }
}
