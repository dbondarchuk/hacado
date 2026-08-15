import { getServicesContainer } from "@/app/utils";
import { paymentsSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/payments")("GET");
  const servicesContainer = await getServicesContainer();

  const params = paymentsSearchParamsLoader(request.nextUrl.searchParams);

  const page = params.page;
  const limit = params.limit;
  const sort = params.sort;
  const offset = (page - 1) * limit;

  const start = params.start ?? undefined;
  const end = params.end ?? undefined;
  const range =
    start || end
      ? {
          start,
          end,
        }
      : undefined;

  const customerId = params.customerId?.[0] ?? undefined;
  const appointmentId = params.appointmentId?.[0] ?? undefined;
  const search = params.search ?? undefined;
  const type = params.type ?? undefined;
  const method = params.method ?? undefined;

  logger.debug(
    {
      limit,
      offset,
      range,
      customerId,
      appointmentId,
      search,
      type,
      method,
      sort,
    },
    "Listing payments",
  );

  const result = await servicesContainer.paymentsService.list({
    limit,
    offset,
    range,
    customerId,
    appointmentId,
    search,
    type,
    method,
    sort,
  });

  return NextResponse.json(result);
}
