import type { SessionUser } from "@hacado/types";
import { canFilterByMember } from "./permissions";

/**
 * Restricts member filters when the user cannot read all members' data.
 * Other roles keep the requested filter (or no filter).
 */
export function gateMemberIds(
  user: SessionUser,
  possibleIds: string[] | undefined,
  options?: {
    canFilter?: (user: SessionUser | null | undefined) => boolean;
  },
): string[] | undefined {
  const canFilter = options?.canFilter ?? canFilterByMember;
  if (!canFilter(user)) {
    return user.memberId ? [user.memberId] : undefined;
  }
  return possibleIds;
}
