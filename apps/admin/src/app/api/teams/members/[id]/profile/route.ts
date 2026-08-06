import { getServicesContainer } from "@/app/utils";
import { requirePermission } from "@/lib/auth/require-permission";
import { userUpdateSchema } from "@hacado/api-sdk";
import type { SessionUser } from "@hacado/types";
import { canUpdateTeamMemberProfile } from "@hacado/utils";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function loadTargetAndAuthorize(memberId: string, user: SessionUser) {
  const services = await getServicesContainer();
  const member = await services.teamService.getMemberById(memberId);
  if (!member) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, code: "not_found", error: "Member not found" },
        { status: 404 },
      ),
    };
  }

  if (
    !canUpdateTeamMemberProfile(user, {
      memberId: member._id,
      role: member.role,
    })
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, code: "forbidden", error: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  return { ok: true as const, member, services };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requirePermission(
    "team",
    "update",
    "AdminAPI/teams/members/[id]/profile",
    "GET",
  );
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const gate = await loadTargetAndAuthorize(id, auth.user);
  if (!gate.ok) return gate.response;

  return NextResponse.json(gate.member);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requirePermission(
    "team",
    "update",
    "AdminAPI/teams/members/[id]/profile",
    "PATCH",
  );
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const gate = await loadTargetAndAuthorize(id, auth.user);
  if (!gate.ok) return gate.response;

  const { data, error, success } = userUpdateSchema
    .partial()
    .safeParse(await request.json());

  if (!success) {
    auth.logger.warn({ error }, "Invalid member profile update format");
    return NextResponse.json(
      { error, success: false, code: "invalid_request_format" },
      { status: 400 },
    );
  }

  const {
    calendarSources: _calendarSources,
    meetingUrlProviderAppId: _meetingUrlProviderAppId,
    ...rest
  } = data;

  auth.logger.debug(
    { memberId: id, data: rest },
    "Updating other member profile fields",
  );

  await gate.services.teamService.updateMemberProfile(id, rest);

  const updated = await gate.services.teamService.getMemberById(id);
  if (!updated) {
    return NextResponse.json(
      { success: false, code: "not_found", error: "Member not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(updated);
}
