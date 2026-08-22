import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/synced-payments/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/synced-payments/[id]")("GET");
  const auth = await requirePermission("syncedPayment", "read", logger);
  if (!auth.ok) return auth.response;

  const servicesContainer = await getServicesContainer();
  const { id } = await params;

  const syncedPayment = await servicesContainer.syncedPaymentsService.get(id);

  if (!syncedPayment) {
    logger.warn({ id }, "Synced payment not found");
    return NextResponse.json(
      {
        success: false,
        error: "Synced payment not found",
        code: "synced_payment_not_found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(syncedPayment);
}
