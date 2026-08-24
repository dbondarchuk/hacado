"use client";

import { authClient } from "@/app/auth-client";
import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Progress,
  Spinner,
  toast,
} from "@hacado/ui";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const StepVerify = ({
  email,
}: {
  email: string;
  callbackURL?: string;
}) => {
  const t = useI18n("install");
  const router = useRouter();
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [otp, setOtp] = useState("");

  const onResendVerification = async () => {
    setResendLoading(true);
    try {
      const r = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      if (r.error?.message) {
        toast.error(t("wizard.verify.resendError"));
      } else {
        toast.success(t("wizard.verify.resendSuccess"));
      }
    } catch {
      toast.error(t("wizard.verify.resendError"));
    } finally {
      setResendLoading(false);
    }
  };

  const onVerify = async () => {
    if (otp.length !== 6) return;
    setVerifyLoading(true);
    try {
      const r = await authClient.emailOtp.verifyEmail({ email, otp });
      if (r.error?.message) {
        toast.error(t("wizard.verify.invalidCode"));
        return;
      }
      toast.success(t("wizard.verify.verified"));
      router.refresh();
    } finally {
      setVerifyLoading(false);
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
        <div className="flex flex-col items-center gap-3">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            disabled={verifyLoading}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (otp.length === 6 && !verifyLoading) void onVerify();
            }}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <Button
            className="w-full"
            onClick={() => void onVerify()}
            disabled={verifyLoading || otp.length !== 6}
          >
            {verifyLoading ? <Spinner /> : null}
            {t("wizard.verify.submit")}
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => void onResendVerification()}
            disabled={resendLoading || verifyLoading}
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
};
