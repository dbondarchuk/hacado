import { getServicesContainer } from "@/app/utils";
import { appointmentHistorySearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/api/appointments/[id]/history">,
) {
  const logger = getLoggerFactory("AdminAPI/appointments/[id]/history")("GET");
  const servicesContainer = await getServicesContainer();
  const { id: appointmentId } = await params;

  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing appointment history API request",
  );

  const searchParams = appointmentHistorySearchParamsLoader(
    request.nextUrl.searchParams,
  );

  const page = searchParams.page;
  const search = searchParams.search ?? undefined;
  const limit = searchParams.limit;
  const sort = searchParams.sort ?? [
    {
      id: "dateTime",
      desc: true,
    },
  ];

  const offset = (page - 1) * limit;

  logger.debug(
    {
      page,
      limit,
      offset,
    },
    "Fetching appointment history with parameters",
  );

  const res = await servicesContainer.bookingService.getAppointmentHistory({
    offset,
    limit,
    search,
    sort: sort ?? undefined,
    appointmentId,
  });

  logger.debug(
    {
      total: res.total,
      count: res.items.length,
    },
    "Successfully retrieved appointment history",
  );

  return NextResponse.json(res);
}
