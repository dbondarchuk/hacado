import type { Language } from "@hacado/i18n";
import { MEMBERS_COLLECTION_NAME } from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import type { OrganizationMember } from "@hacado/types";

/** Prefer active membership language; fall back to first membership, then en. */
export async function getMemberLanguageForUser(
  userId: string,
  organizationId?: string,
): Promise<Language> {
  const db = await getDbConnection();
  if (organizationId) {
    const member = await db
      .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
      .findOne({ organizationId, userId });
    if (member?.language) return member.language;
  }

  const member = await db
    .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
    .find({ userId, status: "active" })
    .sort({ createdAt: 1 })
    .limit(1)
    .next();

  return member?.language || "en";
}
