import type { UserRole } from "@timelish/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { getTeamServices, requireTeamManager } from "../../../_utils";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const roleSchema = z.object({
  role: z.enum(["admin", "coordinator", "staff"]),
});

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const gate = await requireTeamManager(
    "AdminAPI/teams/members/[id]/role",
    "PUT",
  );
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: "invalid_input", error: "Invalid input" },
      { status: 400 },
    );
  }

  const services = await getTeamServices();
  const updated = await services.teamService.updateMemberRole(
    id,
    parsed.data.role as Exclude<UserRole, "owner">,
  );
  if (!updated) {
    return NextResponse.json(
      { success: false, code: "update_failed", error: "Failed to update role" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
