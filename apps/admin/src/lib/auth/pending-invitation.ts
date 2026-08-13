import { getDbConnection } from "@hacado/services/database";
import type { Organization as OrganizationDbModel } from "@hacado/types";

export type PublicInvitation = {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: string;
};

/** Latest pending invitation for an email (used after signup and geo bypass). */
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

export async function hasPendingInvitationForEmail(
  email: string,
): Promise<boolean> {
  return (await findPendingInvitationForEmail(email)) != null;
}
