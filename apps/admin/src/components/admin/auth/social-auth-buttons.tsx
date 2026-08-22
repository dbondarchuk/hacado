"use client";

import { authClient } from "@/app/auth-client";
import { useI18n } from "@hacado/i18n/client";
import { Badge, Button, cn, Spinner } from "@hacado/ui";
import { useState } from "react";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

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

export function GoogleAuthButton({
  callbackURL,
  invitationId,
  showLastUsed = false,
  disabled = false,
}: {
  callbackURL: string;
  invitationId?: string;
  showLastUsed?: boolean;
  disabled?: boolean;
}) {
  const t = useI18n("admin");
  const [loading, setLoading] = useState(false);
  const lastMethod = showLastUsed ? authClient.getLastUsedLoginMethod() : null;
  const isLastUsed = lastMethod === "google";

  const onGoogleSignIn = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
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
        onClick={onGoogleSignIn}
      >
        {loading ? <Spinner /> : <GoogleIcon className="mr-2 size-4" />}
        {t("auth.social.continueWithGoogle")}
        {isLastUsed ? <LastUsedBorderBadge /> : null}
      </Button>
    </div>
  );
}
