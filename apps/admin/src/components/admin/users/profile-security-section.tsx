"use client";

import { authClient } from "@/app/auth-client";
import { EmailChangeDialog } from "@/components/admin/users/email-change-dialog";
import { PasswordChangeDialog } from "@/components/admin/users/password-change-dialog";
import { SetPasswordDialog } from "@/components/admin/users/set-password-dialog";
import { UnlinkGoogleDialog } from "@/components/admin/users/unlink-google-dialog";
import { useI18n } from "@hacado/i18n/client";
import { Button, toast } from "@hacado/ui";
import { Link2, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type LinkedAccount = {
  id: string;
  providerId: string;
};

export function ProfileSecuritySection({ email }: { email: string }) {
  const t = useI18n("admin");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [linking, setLinking] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const result = await authClient.listAccounts();
      if (result.error) {
        console.error(result.error);
        return;
      }
      setAccounts(
        (result.data ?? []).map((account) => ({
          id: account.id,
          providerId: account.providerId,
        })),
      );
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const error = searchParams.get("error");
    const linked = searchParams.get("linked");

    if (error === "email_doesn't_match") {
      toast.error(t("auth.social.errors.emailMismatch"));
    } else if (
      error === "account_not_linked" ||
      error === "unable_to_link_account"
    ) {
      toast.error(t("auth.social.errors.linkFailed"));
    } else if (linked === "google") {
      toast.success(t("users.profile.security.linkGoogleSuccess"));
      void loadAccounts();
      router.refresh();

      const params = new URLSearchParams(searchParams.toString());
      params.delete("linked");
      const query = params.toString();
      router.replace(
        query
          ? `/dashboard/users/me/profile?${query}`
          : "/dashboard/users/me/profile",
        { scroll: false },
      );
    }
  }, [searchParams, t, router, loadAccounts]);

  const hasCredential = accounts.some(
    (account) => account.providerId === "credential",
  );

  const googleAccount = accounts.find(
    (account) => account.providerId === "google",
  );

  const onLinkGoogle = async () => {
    setLinking(true);
    try {
      await authClient.linkSocial({
        provider: "google",
        callbackURL: "/dashboard/users/me/profile?linked=google",
      });
    } finally {
      setLinking(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
            <Mail className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <p className="font-medium">{t("users.profile.security.email")}</p>
            <p className="text-base text-muted-foreground">{email}</p>
          </div>
        </div>
        <EmailChangeDialog currentEmail={email} />
      </div>
      <div className="h-px w-full bg-border" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <p className="font-medium">
              {t("users.profile.security.password")}
            </p>
            <p className="text-base text-muted-foreground">
              {hasCredential
                ? t("users.profile.security.passwordDescription")
                : t("users.profile.security.setPasswordDescription")}
            </p>
          </div>
        </div>
        {!loadingAccounts &&
          (hasCredential ? (
            <PasswordChangeDialog />
          ) : (
            <SetPasswordDialog onSuccess={loadAccounts} />
          ))}
      </div>
      <div className="h-px w-full bg-border" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-md bg-muted flex items-center justify-center">
            <Link2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="font-medium">
              {t("users.profile.security.connectedAccounts")}
            </p>
            <p className="text-base text-muted-foreground truncate">
              {googleAccount
                ? t("users.profile.security.googleConnected")
                : t("users.profile.security.googleNotConnected")}
            </p>
          </div>
        </div>
        {!loadingAccounts &&
          (googleAccount ? (
            hasCredential ? (
              <UnlinkGoogleDialog onSuccess={loadAccounts} />
            ) : (
              <Button variant="outline" disabled>
                {t("users.profile.security.unlinkGoogle")}
              </Button>
            )
          ) : (
            <Button variant="outline" disabled={linking} onClick={onLinkGoogle}>
              {t("users.profile.security.connectGoogle")}
            </Button>
          ))}
      </div>
    </>
  );
}
