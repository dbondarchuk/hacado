import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { requireSubscriptionFeature } from "@/lib/billing/subscription-feature-guard";
import { getLoggerFactory } from "@hacado/logger";
import { appointmentPackageStatuses } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";

const schema = z.object({
  status: z.enum(appointmentPackageStatuses),
});

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/packages/[id]/status">,
) {
  const logger = getLoggerFactory("AdminAPI/packages/[id]/status")("POST");
  const featureAccess = await requireSubscriptionFeature("packages", logger);
  if (!featureAccess.ok) return featureAccess.response;

  const auth = await requirePermission("package", "update", logger);
  if (!auth.ok) return auth.response;

  const actor = await getActor();
  const { id } = await params;
  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json(
      { success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  const servicesContainer = await getServicesContainer();
  const result = await servicesContainer.packagesService.setPackageStatus(
    id,
    body.data.status,
    actor,
  );
  if (!result) {
    return NextResponse.json(
      { success: false, code: "package_not_found" },
      { status: 404 },
    );
  }
  return NextResponse.json(result);
}
