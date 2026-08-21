import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { packagesSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { appointmentPackageSchema, PackageError } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/packages")("GET");
  const featureAccess = await requireSubscriptionFeature("packages", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("package", "read", logger);
  if (!auth.ok) return auth.response;

  const servicesContainer = await getServicesContainer();
  const params = packagesSearchParamsLoader(request.nextUrl.searchParams);
  const offset = (params.page - 1) * params.limit;

  const res = await servicesContainer.packagesService.getPackages({
    offset,
    limit: params.limit,
    search: params.search ?? undefined,
    sort: params.sort,
    status: params.status,
    priorityIds: params.priorityId ?? undefined,
  });

  return NextResponse.json(res);
}

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/packages")("POST");
  const featureAccess = await requireSubscriptionFeature("packages", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("package", "create", logger);
  if (!auth.ok) return auth.response;

  const actor = await getActor();
  const servicesContainer = await getServicesContainer();
  const body = await request.json();
  const { data, error, success } = appointmentPackageSchema.safeParse(body);
  if (!success) {
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  try {
    const result = await servicesContainer.packagesService.createPackage(
      data,
      actor,
    );
    return NextResponse.json(result, { status: 201 });
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
