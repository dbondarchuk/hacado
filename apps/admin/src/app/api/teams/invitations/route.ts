import { auth } from "@/app/auth";
import { getOrganizationId } from "@/app/utils";
import type { UserRole } from "@hacado/types";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
import { getTeamServices, requireTeamManager } from "../_utils";

export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "coordinator", "staff"]),
});

export async function GET(request: NextRequest) {
  const gate = await requireTeamManager("AdminAPI/teams/invitations", "GET");
  if (!gate.ok) return gate.response;

  try {
    const invitations = await auth.api.listInvitations({
      query: { organizationId: await getOrganizationId() },
      headers: request.headers,
    });
    return NextResponse.json({
      invitations: (invitations ?? []).map((i: any) => ({
        id: i.id,
        email: i.email,
        role: String(i.role) as UserRole,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, code: "list_failed", error: "Failed to list invitations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const gate = await requireTeamManager("AdminAPI/teams/invitations", "POST");
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: "invalid_input", error: "Invalid input" },
      { status: 400 },
    );
  }

  const services = await getTeamServices();
  if (!(await services.teamService.canInviteMoreMembers())) {
    return NextResponse.json(
      {
        success: false,
        code: "no_available_slots",
        error: "No available user slots",
      },
      { status: 409 },
    );
  }

  const organizationId = await getOrganizationId();
  try {
    await auth.api.createInvitation({
      body: {
        email: parsed.data.email,
        role: parsed.data.role,
        organizationId,
      },
      headers: request.headers,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invite_failed";
    const serialized = `${message} ${JSON.stringify(
      (error as { body?: unknown; code?: unknown })?.body ??
        (error as { code?: unknown })?.code ??
        "",
    )}`;
    if (serialized.includes("USER_ALREADY_IN_ORGANIZATION")) {
      return NextResponse.json(
        {
          success: false,
          code: "user_already_in_organization",
          error: "User already in organization",
        },
        { status: 409 },
      );
    }
    if (serialized.includes("NO_AVAILABLE_USER_SLOTS")) {
      return NextResponse.json(
        {
          success: false,
          code: "no_available_slots",
          error: "No available user slots",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        success: false,
        code: "invite_failed",
        error: message,
      },
      { status: 500 },
    );
  }
}
