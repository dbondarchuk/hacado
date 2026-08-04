"use server";

import { getDbConnection } from "@timelish/services/database";
import type { Organization as OrganizationDbModel } from "@timelish/types";

export type PublicInvitation = {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: string;
};

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

/** Latest pending invitation for an email (used after signup → dashboard). */
export async function findPendingInvitationForEmail(
  email: string,
): Promise<PublicInvitation | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const db = await getDbConnection();
  const invitation = await db.collection("invitations").findOne(
    {
      email: normalized,
      status: "pending",
      expiresAt: { $gt: new Date() },
    },
    { sort: { createdAt: -1 } },
  );

  if (!invitation) return null;

  const organization = await db
    .collection<OrganizationDbModel>("organizations")
    .findOne(
      { _id: invitation.organizationId as string },
      { projection: { name: 1 } },
    );

  return {
    id: String(invitation._id),
    email: String(invitation.email),
    organizationId: String(invitation.organizationId),
    organizationName: organization?.name || "",
    role: String(invitation.role || "member"),
  };
}
