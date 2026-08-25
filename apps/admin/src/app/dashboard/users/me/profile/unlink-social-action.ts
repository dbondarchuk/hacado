"use server";

import { auth } from "@/app/auth";
import {
  isSocialAuthProvider,
  type SocialAuthProvider,
} from "@/lib/auth/social-auth-providers";
import { getDbConnection } from "@hacado/services/database";
import { headers } from "next/headers";

export async function unlinkSocialAccount(
  providerId: SocialAuthProvider,
  password: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  if (!isSocialAuthProvider(providerId)) {
    return { ok: false, code: "invalid_provider" };
  }

  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
    query: { disableCookieCache: true },
  });

  if (!session?.user?.id) {
    return { ok: false, code: "unauthorized" };
  }

  const accounts = await auth.api.listUserAccounts({ headers: headersList });
  const hasCredential = accounts?.some(
    (account) => account.providerId === "credential",
  );
  const socialAccount = accounts?.find(
    (account) => account.providerId === providerId,
  );

  if (!socialAccount) {
    return { ok: false, code: "not_linked" };
  }

  if (!hasCredential) {
    return { ok: false, code: "no_credential" };
  }

  if ((accounts?.length ?? 0) <= 1) {
    return { ok: false, code: "last_account" };
  }

  try {
    await auth.api.verifyPassword({
      body: { password },
      headers: headersList,
    });
  } catch {
    return { ok: false, code: "invalid_password" };
  }

  const db = await getDbConnection();
  const result = await db.collection("accounts").deleteOne({
    userId: session.user.id,
    providerId,
  });

  if (result.deletedCount === 0) {
    return { ok: false, code: "unlink_failed" };
  }

  return { ok: true };
}
