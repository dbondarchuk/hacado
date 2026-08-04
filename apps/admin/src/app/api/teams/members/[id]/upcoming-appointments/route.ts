import { NextRequest, NextResponse } from "next/server";
import { getTeamServices, requireTeamManager } from "../../../_utils";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const gate = await requireTeamManager(
    "AdminAPI/teams/members/[id]/upcoming-appointments",
    "GET",
  );
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const services = await getTeamServices();
  const upcoming =
    await services.teamService.listUpcomingAppointmentsForMember(id);
  return NextResponse.json({ upcoming });
}
