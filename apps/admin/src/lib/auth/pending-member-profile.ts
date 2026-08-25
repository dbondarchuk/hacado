import type { Language } from "@hacado/i18n";
import { USERS_COLLECTION_NAME } from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import type { PendingMemberProfile, User } from "@hacado/types";

export type { PendingMemberProfile };

export type ResolvedMemberProfileFields = {
  status: "active";
  email: string;
  name: string;
  phone: string;
  language: Language;
  /** Copied from social/OAuth user avatar when the member row is created. */
  image: string | null;
};

async function setPendingMemberProfile(
  filter: Record<string, unknown>,
  profile: PendingMemberProfile,
): Promise<boolean> {
  const db = await getDbConnection();
  const result = await db
    .collection<User>(USERS_COLLECTION_NAME)
    .updateOne(filter, {
      $set: {
        pendingMemberProfile: profile,
        updatedAt: new Date(),
      },
    });
  return result.matchedCount > 0;
}

/** Staging profile collected at signup until a member row is created. */
export async function savePendingMemberProfile(
  userId: string,
  profile: PendingMemberProfile,
): Promise<void> {
  await setPendingMemberProfile({ _id: userId }, profile);
}

export async function savePendingMemberProfileByEmail(
  email: string,
  profile: PendingMemberProfile,
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await setPendingMemberProfile(
    { $expr: { $eq: [{ $toLower: "$email" }, normalized] } },
    profile,
  );
}

async function takePendingMemberProfileByFilter(
  filter: Record<string, unknown>,
): Promise<PendingMemberProfile | null> {
  const db = await getDbConnection();
  const result = await db
    .collection<User>(USERS_COLLECTION_NAME)
    .findOneAndUpdate(
      {
        ...filter,
        pendingMemberProfile: { $exists: true, $ne: null },
      },
      {
        $unset: { pendingMemberProfile: "" },
        $set: { updatedAt: new Date() },
      },
      {
        returnDocument: "before",
        projection: { pendingMemberProfile: 1 },
      },
    );

  const pending = result?.pendingMemberProfile;
  if (!pending || typeof pending !== "object") return null;
  return pending;
}

export async function takePendingMemberProfile(
  userId: string,
  email?: string,
): Promise<PendingMemberProfile | null> {
  const byUser = await takePendingMemberProfileByFilter({ _id: userId });
  if (byUser) return byUser;

  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return takePendingMemberProfileByFilter({
    $expr: { $eq: [{ $toLower: "$email" }, normalized] },
  });
}

/**
 * Consumes the signup staging profile (if any) and returns fields to persist
 * on the organization member row.
 */
export async function resolveMemberProfileFields(
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  },
  member?: {
    name?: string;
    phone?: string;
    language?: Language;
    image?: string | null;
  },
): Promise<ResolvedMemberProfileFields> {
  const pending = await takePendingMemberProfile(user.id, user.email);
  return {
    status: "active",
    email: user.email.toLowerCase(),
    name: pending?.name || member?.name || user.name || "",
    phone: pending?.phone || member?.phone || "",
    language: pending?.language || member?.language || "en",
    image: member?.image || user.image || null,
  };
}
