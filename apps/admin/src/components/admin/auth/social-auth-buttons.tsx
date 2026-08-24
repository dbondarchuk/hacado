"use client";

import { authClient } from "@/app/auth-client";
import { AUTH_ERROR_PATH } from "@/lib/auth/auth-error";
import type { SocialAuthProvider } from "@/lib/auth/social-auth-providers";
import { useI18n } from "@hacado/i18n/client";
import { Badge, Button, cn, Spinner } from "@hacado/ui";
import { type ComponentType, useState } from "react";
import { GoogleIcon, MicrosoftIcon, ZoomIcon } from "./logo";

const PROVIDER_LABEL_KEYS = {
  google: "auth.social.continueWithGoogle",
  microsoft: "auth.social.continueWithMicrosoft",
  zoom: "auth.social.continueWithZoom",
} as const;

const PROVIDER_ICONS: Record<
  SocialAuthProvider,
  ComponentType<{ className?: string }>
> = {
  google: GoogleIcon,
  microsoft: MicrosoftIcon,
  zoom: ZoomIcon,
};

export function SocialAuthDivider() {
  const t = useI18n("admin");
  return (
    <div className="relative w-full">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">
          {t("auth.social.orContinueWithEmail")}
        </span>
      </div>
    </div>
  );
}

function LastUsedBorderBadge({ className }: { className?: string }) {
  const t = useI18n("admin");
  return (
    <Badge
      variant="secondary"
      className={cn(
        "pointer-events-none absolute -top-2.5 right-3 border border-border bg-card px-1.5 py-0 text-[10px] font-normal leading-4 shadow-sm",
        className,
      )}
    >
      {t("auth.social.lastUsed")}
    </Badge>
  );
}

export function LastUsedInlineBadge() {
  const t = useI18n("admin");
  return (
    <Badge variant="secondary" className="text-[10px] font-normal leading-4">
      {t("auth.social.lastUsed")}
    </Badge>
  );
}

function SocialAuthButton({
  provider,
  callbackURL,
  invitationId,
  showLastUsed = false,
  disabled = false,
}: {
  provider: SocialAuthProvider;
  callbackURL: string;
  invitationId?: string;
  showLastUsed?: boolean;
  disabled?: boolean;
}) {
  const t = useI18n("admin");
  const [loading, setLoading] = useState(false);
  const lastMethod = showLastUsed ? authClient.getLastUsedLoginMethod() : null;
  const isLastUsed = lastMethod === provider;
  const Icon = PROVIDER_ICONS[provider];

  const onSignIn = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
        errorCallbackURL: AUTH_ERROR_PATH,
        ...(invitationId ? { additionalData: { invitationId } } : undefined),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isLastUsed ? "pt-2.5" : undefined}>
      <Button
        type="button"
        variant="outline"
        className="relative w-full"
        disabled={disabled || loading}
        onClick={onSignIn}
      >
        {loading ? <Spinner /> : <Icon className="mr-2 size-4" />}
        {t(PROVIDER_LABEL_KEYS[provider])}
        {isLastUsed ? <LastUsedBorderBadge /> : null}
      </Button>
    </div>
  );
}

export function SocialAuthButtons({
  enabledProviders,
  callbackURL,
  invitationId,
  showLastUsed = false,
  disabled = false,
}: {
  enabledProviders: SocialAuthProvider[];
  callbackURL: string;
  invitationId?: string;
  showLastUsed?: boolean;
  disabled?: boolean;
}) {
  if (enabledProviders.length === 0) return null;

  return (
    <>
      <div className="flex w-full flex-col gap-2">
        {enabledProviders.map((provider) => (
          <SocialAuthButton
            key={provider}
            provider={provider}
            callbackURL={callbackURL}
            invitationId={invitationId}
            showLastUsed={showLastUsed}
            disabled={disabled}
          />
        ))}
      </div>
      <SocialAuthDivider />
    </>
  );
}
