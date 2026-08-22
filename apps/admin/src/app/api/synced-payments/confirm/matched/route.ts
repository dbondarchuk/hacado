import { getActor, getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/synced-payments/confirm/matched")(
    "POST",
  );
  const auth = await requirePermission("syncedPayment", "manage", logger);
  if (!auth.ok) return auth.response;
  const servicesContainer = await getServicesContainer();
  const actor = await getActor();

  const body = await request.json().catch(() => ({}));

  const startParam = body?.start;
  const endParam = body?.end;
  const start =
    typeof startParam === "string" ? new Date(startParam) : undefined;
  const end = typeof endParam === "string" ? new Date(endParam) : undefined;
  const externalId =
    typeof body?.externalId === "string" ? body.externalId : undefined;

  const range =
    (start && !isNaN(start.getTime())) || (end && !isNaN(end.getTime()))
      ? {
          start: start && !isNaN(start.getTime()) ? start : undefined,
          end: end && !isNaN(end.getTime()) ? end : undefined,
        }
      : undefined;

  logger.debug({ range, externalId }, "Confirming all matched synced payments");

  try {
    const result =
      await servicesContainer.syncedPaymentsService.confirmAllMatched(actor, {
        range,
        externalId,
      });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error(
      { error: error?.message || error?.toString() },
      "Failed to confirm all matched synced payments",
    );
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to confirm matched synced payments",
        code: "confirm_all_matched_failed",
      },
      { status: 500 },
    );
  }
}
