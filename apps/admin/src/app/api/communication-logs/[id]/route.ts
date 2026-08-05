import { getServicesContainer, getUser } from "@/app/utils";
import { getLoggerFactory } from "@hacado/logger";
import {
  canFilterCommunicationByMember,
  gateMemberIds,
} from "@hacado/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/communication-logs/[id]">,
) {
  const logger = getLoggerFactory("AdminAPI/communication-logs/[id]")("GET");
  const { id } = await params;
  const [servicesContainer, user] = await Promise.all([
    getServicesContainer(),
    getUser(),
  ]);
  const memberIds = gateMemberIds(user, undefined, {
    canFilter: canFilterCommunicationByMember,
  });

  logger.debug({ logId: id, memberIds }, "Fetching communication log payload");

  const content =
    await servicesContainer.communicationLogsService.getCommunicationLogContent(
      id,
      { memberId: memberIds ?? undefined },
    );

  if (!content) {
    logger.warn({ logId: id }, "Communication log payload not found");
    return NextResponse.json(
      { success: false, error: "communication_log_not_found" },
      { status: 404 },
    );
  }

  return NextResponse.json(content);
}
