import { getServicesContainer, getUser } from "@/app/utils";
import { communicationLogsSearchParamsLoader } from "@hacado/api-sdk";
import { getLoggerFactory } from "@hacado/logger";
import { okStatus } from "@hacado/types";
import {
  canFilterCommunicationByMember,
  gateMemberIds,
} from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/communication-logs")("GET");
  const [servicesContainer, user] = await Promise.all([
    getServicesContainer(),
    getUser(),
  ]);
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing communication logs API request",
  );

  const params = communicationLogsSearchParamsLoader(
    request.nextUrl.searchParams,
  );

  const page = params.page;
  const search = params.search ?? undefined;
  const limit = params.limit;
  const sort = params.sort;
  const customerId = params.customer ?? undefined;
  const appointmentId = params.appointmentId ?? undefined;
  const direction = params.direction;
  const channel = params.channel;
  const start = params.start ?? undefined;
  const end = params.end ?? undefined;
  const participantType = params.participantType ?? undefined;
  const memberIds = gateMemberIds(user, params.member ?? undefined, {
    canFilter: canFilterCommunicationByMember,
  });

  const offset = (page - 1) * limit;

  logger.debug(
    {
      page,
      limit,
      offset,
      memberIds,
    },
    "Fetching communication logs with parameters",
  );

  const res =
    await servicesContainer.communicationLogsService.getCommunicationLogs({
      offset,
      limit,
      search,
      sort,
      customerId,
      appointmentId,
      direction,
      channel,
      participantType,
      memberId: memberIds ?? undefined,
      range:
        start || end
          ? {
              start,
              end,
            }
          : undefined,
    });

  logger.debug(
    {
      total: res.total,
      count: res.items.length,
    },
    "Successfully retrieved communication logs",
  );

  return NextResponse.json(res);
}

export async function DELETE(request: NextRequest) {
  const logger = getLoggerFactory("AdminAPI/communication-logs")("DELETE");
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      url: request.url,
      method: request.method,
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries()),
    },
    "Processing deleting all communication logs API request",
  );

  await servicesContainer.communicationLogsService.clearAllLogs();

  logger.debug("All communication logs deleted successfully");

  return NextResponse.json(okStatus, { status: 200 });
}
