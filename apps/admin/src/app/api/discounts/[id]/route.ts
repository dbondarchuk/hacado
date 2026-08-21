import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { getLoggerFactory } from "@hacado/logger";
import { discountSchema, okStatus } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/discounts/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/discounts/[id]")("GET");
  const featureAccess = await requireSubscriptionFeature("discounts", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("discount", "read", logger);
  if (!auth.ok) return auth.response;

  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      discountId: id,
    },
    "Processing get discount by ID API request",
  );

  const discount = await servicesContainer.servicesService.getDiscount(id);

  if (!discount) {
    logger.warn({ discountId: id }, "Discount not found");
    return NextResponse.json(
      {
        success: false,
        error: "Discount not found",
        code: "discount_not_found",
      },
      { status: 404 },
    );
  }

  logger.debug(
    { discountId: id, discountName: discount.name },
    "Discount found",
  );

  return NextResponse.json(discount);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/discounts/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/discounts/[id]")("PUT");
  const featureAccess = await requireSubscriptionFeature("discounts", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const { ok, response } = await requirePermission(
    "discount",
    "update",
    logger,
  );
  if (!ok) return response;

  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      discountId: id,
    },
    "Processing update discount by ID API request",
  );

  const body = await request.json();
  const { data, success, error } = discountSchema.safeParse(body);

  if (!success) {
    logger.warn({ error }, "Invalid discount update model format");
    return NextResponse.json(
      {
        success: false,
        error: "Invalid discount update model format",
        code: "invalid_request_format",
      },
      { status: 400 },
    );
  }

  await servicesContainer.servicesService.updateDiscount(id, data, actor);

  logger.debug(
    { discountId: id, discountName: data.name },
    "Discount updated successfully",
  );

  return NextResponse.json(okStatus, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/discounts/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/discounts/[id]")("DELETE");
  const featureAccess = await requireSubscriptionFeature("discounts", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const { ok, response } = await requirePermission(
    "discount",
    "delete",
    logger,
  );
  if (!ok) return response;

  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      discountId: id,
    },
    "Processing delete discount by ID API request",
  );

  const result = await servicesContainer.servicesService.deleteDiscount(
    id,
    actor,
  );

  if (!result) {
    logger.warn({ discountId: id }, "Discount not found");
    return NextResponse.json(
      {
        success: false,
        error: "Discount not found",
        code: "discount_not_found",
      },
      { status: 404 },
    );
  }

  logger.debug({ discountId: id }, "Discount deleted successfully");
  return NextResponse.json(result, { status: 200 });
}
