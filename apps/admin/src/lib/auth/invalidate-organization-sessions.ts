import { auth } from "@/app/auth";
import { getLoggerFactory } from "@hacado/logger";
import {
  MEMBERS_COLLECTION_NAME,
  ORGANIZATIONS_COLLECTION_NAME,
} from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import type { Organization, OrganizationMember } from "@hacado/types";

async function collectOrganizationUserIds(
  organizationId: string,
): Promise<string[]> {
  const db = await getDbConnection();
  const members = await db
    .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
    .find({ organizationId }, { projection: { userId: 1 } })
    .toArray();

  const userIds = new Set<string>();
  for (const member of members) {
    if (member.userId) userIds.add(member.userId);
  }
  return [...userIds];
}

/**
 * Refreshes Better Auth secondary-storage sessions for every org member after
 * Polar entitlement changes.
 *
 * Uses `internalAdapter.updateUser`, which also calls `refreshUserSessions` and
 * updates Redis - the approach recommended by Better Auth maintainers when
 * there is no public revalidateSession API:
 * https://github.com/better-auth/better-auth/issues/7513#issuecomment-3888251954
 *
 * Entitlement / profile fields are not stored on users; customSession reloads
 * them from the organization + member on the next getSession after refresh.
 */
export async function invalidateOrganizationSessions(
  organizationId: string,
): Promise<void> {
  const logger = getLoggerFactory("AuthSessions")(
    "invalidateOrganizationSessions",
  );

  const db = await getDbConnection();
  const organization = await db
    .collection<Organization>(ORGANIZATIONS_COLLECTION_NAME)
    .findOne({ _id: organizationId });

  if (!organization) {
    logger.warn({ organizationId }, "Organization not found");
    return;
  }

  const userIds = await collectOrganizationUserIds(organizationId);
  if (userIds.length === 0) {
    logger.debug({ organizationId }, "No users to revalidate sessions for");
    return;
  }

  const ctx = await auth.$context;
  let refreshed = 0;

  for (const userId of userIds) {
    try {
      await ctx.internalAdapter.updateUser(userId, {
        updatedAt: new Date(),
      });
      refreshed += 1;
    } catch (error) {
      logger.warn(
        { error, userId, organizationId },
        "Failed to refresh sessions for user",
      );
    }
  }

  logger.info(
    { organizationId, userCount: userIds.length, refreshed },
    "Refreshed organization member sessions via internalAdapter.updateUser",
  );
}
