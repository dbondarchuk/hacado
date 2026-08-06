import { auth } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";
import { requireTeamManager } from "../../_utils";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const gate = await requireTeamManager(
    "AdminAPI/teams/invitations/[id]",
    "DELETE",
  );
  if (!gate.ok) return gate.response;

  const { id } = await params;
  try {
    await auth.api.cancelInvitation({
      body: { invitationId: id },
      headers: request.headers,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: "cancel_failed",
        error: "Failed to cancel invitation",
      },
      { status: 500 },
    );
  }
}
