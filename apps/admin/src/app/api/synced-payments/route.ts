import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { syncedPaymentStatus, SyncedPaymentStatus } from "@timelish/types";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requirePermission(
    "syncedPayment",
    "read",
    "AdminAPI/synced-payments",
    "GET",
  );
  if (!auth.ok) return auth.response;

  const logger = auth.logger;
  const servicesContainer = await getServicesContainer();

  const searchParams = request.nextUrl.searchParams;

  const status = searchParams
    .getAll("status")
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value): value is SyncedPaymentStatus =>
      (syncedPaymentStatus as readonly string[]).includes(value),
    );

  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : undefined;
  const offset = searchParams.get("offset")
    ? Number(searchParams.get("offset"))
    : undefined;

  const externalId = searchParams.get("externalId") || undefined;

  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const start = startParam ? new Date(startParam) : undefined;
  const end = endParam ? new Date(endParam) : undefined;
  const range =
    (start && !isNaN(start.getTime())) || (end && !isNaN(end.getTime()))
      ? {
          start: start && !isNaN(start.getTime()) ? start : undefined,
          end: end && !isNaN(end.getTime()) ? end : undefined,
        }
      : undefined;

  logger.debug(
    { status, limit, offset, range, externalId },
    "Listing synced payments",
  );

  const result = await servicesContainer.syncedPaymentsService.list({
    status: status.length ? status : undefined,
    range,
    externalId,
    limit,
    offset,
  });

  return NextResponse.json(result);
}
