"use client";

import {
  authErrorMessageKey,
  normalizeAuthErrorCode,
} from "@/lib/auth/auth-error";
import { useI18n } from "@hacado/i18n/client";
import { Link } from "@hacado/ui";
import { useSearchParams } from "next/navigation";

export function AuthErrorContent() {
  const t = useI18n("admin");
  const searchParams = useSearchParams();
  const code = normalizeAuthErrorCode(searchParams.get("error"));
  const description = searchParams.get("error_description")?.trim() || null;
  const message = t(authErrorMessageKey(code) as Parameters<typeof t>[0]);

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-center text-base text-foreground">{message}</p>
      {description && description !== code ? (
        <p className="text-center text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {code ? (
        <p className="text-center font-mono text-xs text-muted-foreground">
          {code}
        </p>
      ) : null}
      <div className="flex w-full flex-col gap-2 pt-2">
        <Link
          button
          href="/dashboard/users/me/profile"
          variant="brand-dark"
          className="w-full justify-center"
        >
          {t("auth.error.backToProfile")}
        </Link>
        <Link
          button
          href="/auth/signin"
          variant="outline"
          className="w-full justify-center"
        >
          {t("auth.error.backToSignIn")}
        </Link>
      </div>
    </div>
  );
}
