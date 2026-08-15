import { NextResponse } from "next/server";
import { getTeamServices, requireCanReadAllAppointments } from "../_utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireCanReadAllAppointments(
    "AdminAPI/teams/inactive-warnings",
    "GET",
  );
  if (!gate.ok) return gate.response;
  if (gate.skip) {
    return NextResponse.json({ ok: true, warnings: [] });
  }

  const services = await getTeamServices();
  const warnings =
    await services.teamService.hasUpcomingAppointmentsOnInactiveMembers();
  return NextResponse.json({ ok: true, warnings });
}
