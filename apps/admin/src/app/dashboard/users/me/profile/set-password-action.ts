"use server";

import { auth } from "@/app/auth";
import { headers } from "next/headers";

export async function setUserPassword(
  newPassword: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { ok: false, code: "unauthorized" };
  }

  const accounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });

  const hasCredential = accounts?.some(
    (account) => account.providerId === "credential",
  );
  if (hasCredential) {
    return { ok: false, code: "credential_exists" };
  }

  try {
    await auth.api.setPassword({
      body: { newPassword },
      headers: await headers(),
    });
    return { ok: true };
  } catch {
    return { ok: false, code: "set_password_failed" };
  }
}
