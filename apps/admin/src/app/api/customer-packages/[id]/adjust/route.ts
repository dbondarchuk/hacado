import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { getLoggerFactory } from "@hacado/logger";
import {
  PackageAdjustRequest,
  packageAdjustRequestSchema,
  PackageError,
} from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/customer-packages/[id]/adjust">,
) {
  const logger = getLoggerFactory("AdminAPI/customer-packages/[id]/adjust")(
    "POST",
  );
  const featureAccess = await requireSubscriptionFeature("packages", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const { ok, response } = await requirePermission("package", "adjust", logger);
  if (!ok) return response;

  const actor = await getActor();
  const { id } = await params;
  const parsed = packageAdjustRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  logger.debug("Adjusting package", { id, request: parsed.data });

  const servicesContainer = await getServicesContainer();
  try {
    const result = await servicesContainer.packagesService.adjust(
      id,
      parsed.data as PackageAdjustRequest,
      actor,
    );

    logger.debug("Successfully adjusted package", { result });
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof PackageError) {
      logger.error("Error adjusting package", { error });
      return NextResponse.json(
        { success: false, code: error.code, error: error.message },
        { status: 400 },
      );
    }

    throw error;
  }
}
