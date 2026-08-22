"use client";

import { authClient } from "@/app/auth-client";
import { EmailChangeDialog } from "@/components/admin/users/email-change-dialog";
import { PasswordChangeDialog } from "@/components/admin/users/password-change-dialog";
import { SetPasswordDialog } from "@/components/admin/users/set-password-dialog";
import { UnlinkSocialDialog } from "@/components/admin/users/unlink-social-dialog";
import {
  isSocialAuthProvider,
  type SocialAuthProvider,
} from "@/lib/auth/social-auth-providers";
import { useI18n } from "@hacado/i18n/client";
import { Button, toast } from "@hacado/ui";
import { Link2, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type LinkedAccount = {
  id: string;
  providerId: string;
};

type ProviderSecurityKeys = {
  connected: string;
  notConnected: string;
  connect: string;
  unlink: string;
  linkSuccess: string;
};

const PROVIDER_SECURITY_KEYS: Record<SocialAuthProvider, ProviderSecurityKeys> =
  {
    google: {
      connected: "users.profile.security.googleConnected",
      notConnected: "users.profile.security.googleNotConnected",
      connect: "users.profile.security.connectGoogle",
      unlink: "users.profile.security.unlinkGoogle",
      linkSuccess: "users.profile.security.linkGoogleSuccess",
    },
    microsoft: {
      connected: "users.profile.security.microsoftConnected",
      notConnected: "users.profile.security.microsoftNotConnected",
      connect: "users.profile.security.connectMicrosoft",
      unlink: "users.profile.security.unlinkMicrosoft",
      linkSuccess: "users.profile.security.linkMicrosoftSuccess",
    },
    zoom: {
      connected: "users.profile.security.zoomConnected",
      notConnected: "users.profile.security.zoomNotConnected",
      connect: "users.profile.security.connectZoom",
      unlink: "users.profile.security.unlinkZoom",
      linkSuccess: "users.profile.security.linkZoomSuccess",
    },
  };

export function ProfileSecuritySection({
  email,
  enabledSocialProviders = [],
}: {
  email: string;
  enabledSocialProviders?: SocialAuthProvider[];
}) {
  const t = useI18n("admin");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [linkingProvider, setLinkingProvider] =
    useState<SocialAuthProvider | null>(null);

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
    } else if (linked && isSocialAuthProvider(linked)) {
      toast.success(
        t(
          PROVIDER_SECURITY_KEYS[linked].linkSuccess as Parameters<typeof t>[0],
        ),
      );
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

  const onLinkProvider = async (provider: SocialAuthProvider) => {
    setLinkingProvider(provider);
    try {
      await authClient.linkSocial({
        provider,
        callbackURL: `/dashboard/users/me/profile?linked=${provider}`,
      });
    } finally {
      setLinkingProvider(null);
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
      {enabledSocialProviders.length > 0 ? (
        <>
          <div className="h-px w-full bg-border" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-md bg-muted flex items-center justify-center">
              <Link2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-medium">
              {t("users.profile.security.connectedAccounts")}
            </p>
          </div>
          {enabledSocialProviders.map((provider) => {
            const keys = PROVIDER_SECURITY_KEYS[provider];
            const linkedAccount = accounts.find(
              (account) => account.providerId === provider,
            );

            return (
              <div
                key={provider}
                className="flex items-center justify-between gap-4 pl-[52px]"
              >
                <p className="text-base text-muted-foreground truncate">
                  {linkedAccount
                    ? t(keys.connected as Parameters<typeof t>[0])
                    : t(keys.notConnected as Parameters<typeof t>[0])}
                </p>
                {!loadingAccounts &&
                  (linkedAccount ? (
                    hasCredential ? (
                      <UnlinkSocialDialog
                        provider={provider}
                        onSuccess={loadAccounts}
                      />
                    ) : (
                      <Button variant="outline" disabled>
                        {t(keys.unlink as Parameters<typeof t>[0])}
                      </Button>
                    )
                  ) : (
                    <Button
                      variant="outline"
                      disabled={linkingProvider === provider}
                      onClick={() => void onLinkProvider(provider)}
                    >
                      {t(keys.connect as Parameters<typeof t>[0])}
                    </Button>
                  ))}
              </div>
            );
          })}
        </>
      ) : null}
    </>
  );
}
