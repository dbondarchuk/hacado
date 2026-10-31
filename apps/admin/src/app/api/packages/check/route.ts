import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/packages/check")("GET");
  const featureAccess = await requireSubscriptionFeature("packages", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("package", "read", logger);
  if (!auth.ok) return auth.response;

  const name = request.nextUrl.searchParams.get("name");
  const id = request.nextUrl.searchParams.get("id");

  if (!name) {
    logger.warn({ name }, "Missing required name parameter");
    return NextResponse.json(
      {
        success: false,
        error: "Name is required",
        code: "missing_name_parameter",
      },
      { status: 400 },
    );
  }

  logger.debug({ name, id }, "Checking package name uniqueness");

  try {
    const servicesContainer = await getServicesContainer();
    const isUnique =
      await servicesContainer.packagesService.checkPackageUniqueName(
        name,
        id || undefined,
      );

    logger.debug(
      { name, id, isUnique },
      "Package name uniqueness check completed",
    );

    return NextResponse.json({ isUnique });
  } catch (error: unknown) {
    logger.error(
      {
        name,
        id,
        error: error instanceof Error ? error.message : error,
      },
      "Failed to check package name uniqueness",
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check name uniqueness",
        code: "check_name_failed",
      },
      { status: 500 },
    );
  }
}
