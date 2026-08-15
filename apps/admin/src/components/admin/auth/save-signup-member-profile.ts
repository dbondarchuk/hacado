"use server";

import { auth } from "@/app/auth";
import {
  savePendingMemberProfile,
  savePendingMemberProfileByEmail,
  type PendingMemberProfile,
} from "@/lib/auth/pending-member-profile";
import { headers } from "next/headers";

export async function saveSignupMemberProfile(
  profile: PendingMemberProfile & { email?: string; userId?: string },
): Promise<{ ok: boolean }> {
  const { email, userId, ...rest } = profile;
  const session = await auth.api.getSession({ headers: await headers() });
  const id = session?.user?.id || userId;
  if (id) {
    await savePendingMemberProfile(id, rest);
    return { ok: true };
  }
  if (email) {
    await savePendingMemberProfileByEmail(email, rest);
    return { ok: true };
  }
  return { ok: false };
}
