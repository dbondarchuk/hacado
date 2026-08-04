import type { MemberInactiveReason } from "@timelish/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { getTeamServices, requireTeamManager } from "../../../_utils";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  force: z.boolean().optional(),
});

export async function POST(request: NextRequest, { params }: RouteContext) {
  const gate = await requireTeamManager(
    "AdminAPI/teams/members/[id]/deactivate",
    "POST",
  );
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: "invalid_input", error: "Invalid input" },
      { status: 400 },
    );
  }

  const services = await getTeamServices();
  const result = await services.teamService.deactivateMember(
    id,
    "removed" satisfies MemberInactiveReason,
    { force: parsed.data.force },
  );
  return NextResponse.json(result);
}
