import type { Language } from "@timelish/i18n";
import { MEMBERS_COLLECTION_NAME } from "@timelish/services/collections";
import { getDbConnection } from "@timelish/services/database";
import type { OrganizationMember } from "@timelish/types";

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
