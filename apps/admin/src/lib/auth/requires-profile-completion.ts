import { USERS_COLLECTION_NAME } from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import type { User } from "@hacado/types";

/** True when the user still needs to provide phone (and related signup profile fields). */
export async function userRequiresProfileCompletion(user: {
  id: string;
  phone?: string;
}): Promise<boolean> {
  if (user.phone?.trim()) return false;

  const db = await getDbConnection();
  const doc = await db
    .collection<User>(USERS_COLLECTION_NAME)
    .findOne({ _id: user.id }, { projection: { pendingMemberProfile: 1 } });

  const pendingPhone = doc?.pendingMemberProfile?.phone?.trim();
  return !pendingPhone;
}
