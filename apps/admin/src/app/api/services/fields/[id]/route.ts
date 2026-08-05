import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { getLoggerFactory } from "@hacado/logger";
import { fieldSchema, okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/services/fields/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/services/fields/[id]")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      fieldId: id,
    },
    "Getting service field by ID",
  );

  try {
    const field = await servicesContainer.servicesService.getField(id);

    if (!field) {
      logger.warn({ fieldId: id }, "Service field not found");
      return NextResponse.json(
        {
          success: false,
          error: "Service field not found",
          code: "service_field_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug(
      {
        fieldId: id,
        fieldName: field.name,
        fieldType: field.type,
      },
      "Successfully retrieved service field",
    );

    return NextResponse.json(field);
  } catch (error: any) {
    logger.error(
      {
        fieldId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to get service field",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get service field",
        code: "get_service_field_failed",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/services/fields/[id]">,
) {
  const auth = await requirePermission(
    "service",
    "update",
    "AdminAPI/services/fields/[id]",
    "PUT",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const { id } = await params;
  const body = await request.json();

  logger.debug(
    {
      fieldId: id,
      fieldName: body.name,
      fieldType: body.type,
    },
    "Updating service field",
  );

  const { data, error, success } = fieldSchema.safeParse(body);
  if (!success) {
    logger.warn(
      { error, fieldId: id },
      "Invalid service field update model format",
    );
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  try {
    await servicesContainer.servicesService.updateField(id, data, actor);

    logger.debug(
      {
        fieldId: id,
        fieldName: data.name,
        fieldType: data.type,
      },
      "Service field updated successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        fieldId: id,
        fieldName: data.name,
        fieldType: data.type,
        error: error?.message || error?.toString(),
      },
      "Failed to update service field",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update service field",
        code: "update_service_field_failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/services/fields/[id]">,
) {
  const auth = await requirePermission(
    "service",
    "delete",
    "AdminAPI/services/fields/[id]",
    "DELETE",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      fieldId: id,
    },
    "Deleting service field",
  );

  try {
    const field = await servicesContainer.servicesService.deleteField(
      id,
      actor,
    );

    if (!field) {
      logger.warn({ fieldId: id }, "Service field not found for deletion");
      return NextResponse.json(
        {
          success: false,
          error: "Service field not found",
          code: "service_field_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug(
      {
        fieldId: id,
        fieldName: field.name,
        fieldType: field.type,
      },
      "Service field deleted successfully",
    );

    return NextResponse.json(field);
  } catch (error: any) {
    logger.error(
      {
        fieldId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to delete service field",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete service field",
        code: "delete_service_field_failed",
      },
      { status: 500 },
    );
  }
}
