import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { getLoggerFactory } from "@hacado/logger";
import { appointmentAddonSchema, okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/services/addons/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/services/addons/[id]")("GET");
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      addonId: id,
    },
    "Getting service addon by ID",
  );

  try {
    const addon = await servicesContainer.servicesService.getAddon(id);

    if (!addon) {
      logger.warn({ addonId: id }, "Service addon not found");
      return NextResponse.json(
        {
          success: false,
          error: "Service addon not found",
          code: "service_addon_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug(
      {
        addonId: id,
        addonName: addon.name,
      },
      "Successfully retrieved service addon",
    );

    return NextResponse.json(addon);
  } catch (error: any) {
    logger.error(
      {
        addonId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to get service addon",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get service addon",
        code: "get_service_addon_failed",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/services/addons/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/services/addons/[id]")("PUT");
  const auth = await requirePermission("service", "update", logger);
  if (!auth.ok) return auth.response;

  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const { id } = await params;
  const body = await request.json();

  logger.debug(
    {
      addonId: id,
      addonName: body.name,
    },
    "Updating service addon",
  );

  const { data, error, success } = appointmentAddonSchema.safeParse(body);
  if (!success) {
    logger.warn(
      { error, addonId: id },
      "Invalid service addon update model format",
    );
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  try {
    await servicesContainer.servicesService.updateAddon(id, data, actor);

    logger.debug(
      {
        addonId: id,
        addonName: data.name,
      },
      "Service addon updated successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        addonId: id,
        addonName: data.name,
        error: error?.message || error?.toString(),
      },
      "Failed to update service addon",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update service addon",
        code: "update_service_addon_failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/services/addons/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/services/addons/[id]")("DELETE");
  const auth = await requirePermission("service", "delete", logger);
  if (!auth.ok) return auth.response;

  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      addonId: id,
    },
    "Deleting service addon",
  );

  try {
    const addon = await servicesContainer.servicesService.deleteAddon(
      id,
      actor,
    );

    if (!addon) {
      logger.warn({ addonId: id }, "Service addon not found for deletion");
      return NextResponse.json(
        {
          success: false,
          error: "Service addon not found",
          code: "service_addon_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug(
      {
        addonId: id,
        addonName: addon.name,
      },
      "Service addon deleted successfully",
    );

    return NextResponse.json(addon);
  } catch (error: any) {
    logger.error(
      {
        addonId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to delete service addon",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete service addon",
        code: "delete_service_addon_failed",
      },
      { status: 500 },
    );
  }
}
