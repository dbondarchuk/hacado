import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { getLoggerFactory } from "@hacado/logger";
import { appointmentOptionSchema, okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/catalog/services/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/catalog/services/[id]")("GET");
  let id: string | undefined;

  try {
    const servicesContainer = await getServicesContainer();
    id = (await params).id;

    logger.debug(
      {
        serviceId: id,
      },
      "Getting service",
    );

    const service = await servicesContainer.catalogService.getService(id);

    if (!service) {
      logger.warn({ serviceId: id }, "Service not found");
      return NextResponse.json(
        {
          success: false,
          error: "Service not found",
          code: "service_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug(
      {
        serviceId: id,
        serviceName: service.name,
      },
      "Service found",
    );

    return NextResponse.json(service);
  } catch (error: any) {
    logger.error(
      {
        serviceId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to get service",
    );

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get service",
        code: "get_service_failed",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/catalog/services/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/catalog/services/[id]")("PUT");
  const auth = await requirePermission("service", "update", logger);
  if (!auth.ok) return auth.response;

  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      optionId: id,
    },
    "Processing service option update request",
  );

  const body = await request.json();

  const { data, error, success } = appointmentOptionSchema.safeParse(body);
  if (!success) {
    logger.warn(
      { error, optionId: id },
      "Invalid service option update model format",
    );
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug(
    {
      optionId: id,
      optionName: data.name,
      optionDurationType: data.durationType,
      optionDuration: data.durationType === "fixed" ? data.duration : undefined,
      optionPrice: data.durationType === "fixed" ? data.price : undefined,
      optionDurationMin:
        data.durationType === "flexible" ? data.durationMin : undefined,
      optionDurationMax:
        data.durationType === "flexible" ? data.durationMax : undefined,
      optionDurationStep:
        data.durationType === "flexible" ? data.durationStep : undefined,
      optionPricePerHour:
        data.durationType === "flexible" ? data.pricePerHour : undefined,
    },
    "Updating service option",
  );

  try {
    await servicesContainer.catalogService.updateService(id, data, actor);

    logger.debug(
      {
        optionId: id,
        optionName: data.name,
      },
      "Service option updated successfully",
    );

    return NextResponse.json(okStatus);
  } catch (error: any) {
    logger.error(
      {
        optionId: id,
        optionName: data.name,
        error: error?.message || error?.toString(),
      },
      "Failed to update service option",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to update service option",
        code: "update_service_option_failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/catalog/services/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/catalog/services/[id]")("DELETE");
  const auth = await requirePermission("service", "delete", logger);
  if (!auth.ok) return auth.response;

  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      optionId: id,
    },
    "Processing service option delete request",
  );

  logger.debug(
    {
      optionId: id,
    },
    "Deleting service option",
  );

  try {
    const option = await servicesContainer.catalogService.deleteService(
      id,
      actor,
    );

    if (!option) {
      logger.warn({ optionId: id }, "Service option not found for deletion");
      return NextResponse.json(
        {
          success: false,
          error: "Service option not found",
          code: "service_option_not_found",
        },
        { status: 404 },
      );
    }

    logger.debug(
      {
        optionId: id,
        optionName: option.name,
      },
      "Service option deleted successfully",
    );

    return NextResponse.json(option);
  } catch (error: any) {
    logger.error(
      {
        optionId: id,
        error: error?.message || error?.toString(),
      },
      "Failed to delete service option",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to delete service option",
        code: "delete_service_option_failed",
      },
      { status: 500 },
    );
  }
}
