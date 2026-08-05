"use client";

import { authClient } from "@/app/auth-client";
import { useI18n } from "@hacado/i18n/client";
import { Button, Progress, Spinner, toast } from "@hacado/ui";
import { Mail } from "lucide-react";
import { useState } from "react";

export function StepVerify({
  email,
  callbackURL = "/install",
}: {
  email: string;
  callbackURL?: string;
}) {
  const t = useI18n("install");
  const [resendLoading, setResendLoading] = useState(false);

  const onResendVerification = async () => {
    setResendLoading(true);
    try {
      const r = await authClient.sendVerificationEmail({
        email,
        callbackURL,
      });
      if (r.error?.message) {
        toast.error(t("wizard.verify.resendError"));
      } else {
        toast.success(t("wizard.verify.resendSuccess"));
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("wizard.verify.title")}
          </h1>
          <p className="text-base text-muted-foreground">
            {t("wizard.verify.description")}
          </p>
          <p className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-base">
            {email}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={() => void onResendVerification()}
            disabled={resendLoading}
          >
            {resendLoading ? <Spinner /> : null}
            {t("wizard.verify.resend")}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t("wizard.verify.spamHint")}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("wizard.verify.polling")}
        </p>
        <Progress value={0} className="h-2" />
        <p className="text-sm text-muted-foreground">0%</p>
      </div>
    </div>
  );
}
