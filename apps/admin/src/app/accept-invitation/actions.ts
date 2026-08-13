"use server";

import {
  findPendingInvitationForEmail,
  type PublicInvitation,
} from "@/lib/auth/pending-invitation";
import { getDbConnection } from "@hacado/services/database";
import type { Organization as OrganizationDbModel } from "@hacado/types";

export { findPendingInvitationForEmail };
export type { PublicInvitation };

export type GetInvitationResult =
  | { ok: true; invitation: PublicInvitation }
  | { ok: false; error: "missing" | "not_found" | "expired" };

export async function getPublicInvitation(
  invitationId: string,
): Promise<GetInvitationResult> {
  if (!invitationId.trim()) {
    return { ok: false, error: "missing" };
  }

  const db = await getDbConnection();
  const invitation = await db.collection<any>("invitations").findOne({
    _id: invitationId,
    status: "pending",
  });

  if (!invitation) {
    return { ok: false, error: "not_found" };
  }

  const expiresAt = invitation.expiresAt
    ? new Date(invitation.expiresAt as string | Date)
    : null;
  if (expiresAt && expiresAt < new Date()) {
    return { ok: false, error: "expired" };
  }

  const organization = await db
    .collection<OrganizationDbModel>("organizations")
    .findOne(
      { _id: invitation.organizationId as string },
      { projection: { name: 1 } },
    );

  return {
    ok: true,
    invitation: {
      id: String(invitation._id),
      email: String(invitation.email),
      organizationId: String(invitation.organizationId),
      organizationName: organization?.name || "",
      role: String(invitation.role || "member"),
    },
  };
}
