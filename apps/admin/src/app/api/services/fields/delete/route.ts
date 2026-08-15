import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { bulkDeleteSchema } from "@hacado/api-sdk";
import { okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const auth = await requirePermission(
    "service",
    "delete",
    "AdminAPI/services/fields/delete",
    "POST",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const body = await request.json();

  logger.debug(
    {
      fieldIds: body.ids,
      count: body.ids?.length || 0,
    },
    "Processing bulk delete service fields request",
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
    await servicesContainer.servicesService.deleteFields(data.ids, actor);

    logger.debug(
      {
        fieldIds: data.ids,
        count: data.ids.length,
      },
      "Service fields deleted successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        fieldIds: data.ids,
        count: data.ids.length,
        error: error?.message || error?.toString(),
      },
      "Failed to delete service fields",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete service fields",
        code: "delete_service_fields_failed",
      },
      { status: 500 },
    );
  }
}
