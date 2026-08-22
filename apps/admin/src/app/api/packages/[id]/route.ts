import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { getLoggerFactory } from "@hacado/logger";
import {
  appointmentPackageSchema,
  okStatus,
  PackageError,
} from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/packages/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/packages/[id]")("GET");
  const featureAccess = await requireSubscriptionFeature("packages", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("package", "read", logger);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const servicesContainer = await getServicesContainer();
  const pkg = await servicesContainer.packagesService.getPackage(id);
  if (!pkg) {
    return NextResponse.json(
      { success: false, code: "package_not_found" },
      { status: 404 },
    );
  }
  return NextResponse.json(pkg);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext<"/api/packages/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/packages/[id]")("PUT");
  const featureAccess = await requireSubscriptionFeature("packages", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("package", "update", logger);
  if (!auth.ok) return auth.response;

  const actor = await getActor();
  const { id } = await params;
  const servicesContainer = await getServicesContainer();
  const body = await request.json();
  const { data, success, error } = appointmentPackageSchema.safeParse(body);
  if (!success) {
    return NextResponse.json(
      { success: false, error, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  try {
    const result = await servicesContainer.packagesService.updatePackage(
      id,
      data,
      actor,
    );
    if (!result) {
      return NextResponse.json(
        { success: false, code: "package_not_found" },
        { status: 404 },
      );
    }
    return NextResponse.json(okStatus);
  } catch (error: unknown) {
    if (error instanceof PackageError) {
      return NextResponse.json(
        { success: false, code: error.code, error: error.message },
        { status: 400 },
      );
    }
    throw error;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext<"/api/packages/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/packages/[id]")("DELETE");
  const featureAccess = await requireSubscriptionFeature("packages", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("package", "delete", logger);
  if (!auth.ok) return auth.response;

  const actor = await getActor();
  const { id } = await params;
  const servicesContainer = await getServicesContainer();
  try {
    const result = await servicesContainer.packagesService.deletePackage(
      id,
      actor,
    );
    if (!result) {
      return NextResponse.json(
        { success: false, code: "package_not_found" },
        { status: 404 },
      );
    }
    return NextResponse.json(okStatus);
  } catch (error: unknown) {
    if (error instanceof PackageError) {
      return NextResponse.json(
        { success: false, code: error.code, error: error.message },
        { status: 400 },
      );
    }
    throw error;
  }
}
