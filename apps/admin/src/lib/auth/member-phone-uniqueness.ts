import {
  MEMBERS_COLLECTION_NAME,
  USERS_COLLECTION_NAME,
} from "@hacado/services/collections";
import { getDbConnection } from "@hacado/services/database";
import type { OrganizationMember, User } from "@hacado/types";

export function normalizeMemberPhone(phone: string): string {
  return phone.trim();
}

export function isDuplicateMemberPhonesAllowed(): boolean {
  return process.env.ALLOW_DUPLICATE_MEMBER_PHONES === "true";
}

export type MemberPhoneUniquenessContext = {
  /** Exclude this member when updating an existing profile */
  excludeMemberId?: string;
  /** Exclude this user when checking pending signup profiles */
  excludeUserId?: string;
};

/**
 * Returns true if the phone can be used (available or uniqueness disabled).
 */
export async function isMemberPhoneAvailable(
  phone: string,
  context: MemberPhoneUniquenessContext = {},
): Promise<boolean> {
  if (isDuplicateMemberPhonesAllowed()) {
    return true;
  }

  const normalized = normalizeMemberPhone(phone);
  if (!normalized) {
    return false;
  }

  const db = await getDbConnection();

  const memberFilter: Record<string, unknown> = { phone: normalized };
  if (context.excludeMemberId) {
    memberFilter._id = { $ne: context.excludeMemberId };
  }

  const existingMember = await db
    .collection<OrganizationMember>(MEMBERS_COLLECTION_NAME)
    .findOne(memberFilter, { projection: { _id: 1 } });

  if (existingMember) {
    return false;
  }

  const pendingFilter: Record<string, unknown> = {
    "pendingMemberProfile.phone": normalized,
  };
  if (context.excludeUserId) {
    pendingFilter._id = { $ne: context.excludeUserId };
  }

  const pendingUser = await db
    .collection<User>(USERS_COLLECTION_NAME)
    .findOne(pendingFilter, { projection: { _id: 1 } });

  return !pendingUser;
}
