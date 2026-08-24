"use client";

import { authClient } from "@/app/auth-client";
import {
  captchaFetchOptions,
  isCaptchaError,
  TurnstileField,
  useTurnstileField,
} from "@/components/admin/auth/turnstile-field";
import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Spinner,
  toast,
} from "@hacado/ui";
import { useEffect, useState } from "react";

/** Survives React Strict Mode remounts so auto-send only fires once per email. */
const autoSendInFlight = new Set<string>();
const autoSendCompleted = new Set<string>();

export type EmailOtpPurpose = "email-verification" | "forget-password";

export const EmailOtpStep = ({
  email,
  onVerified,
  autoSend = true,
  purpose = "email-verification",
  turnstileSiteKey,
}: {
  email: string;
  onVerified: (otp: string) => void | Promise<void>;
  autoSend?: boolean;
  purpose?: EmailOtpPurpose;
  /** Required for forget-password sends (captcha-protected endpoint). */
  turnstileSiteKey?: string;
}) => {
  const t = useI18n("admin");
  const emailKey = `${purpose}:${email.toLowerCase()}`;
  const requiresCaptcha = purpose === "forget-password" && !!turnstileSiteKey;
  const turnstile = useTurnstileField();
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(() => autoSendCompleted.has(emailKey));
  const [cooldown, setCooldown] = useState(() =>
    autoSendCompleted.has(emailKey) ? 60 : 0,
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const sendCode = async (opts?: { fromAutoSend?: boolean }) => {
    if (requiresCaptcha && !turnstile.token) {
      toast.error(t("auth.captcha.error"));
      return false;
    }

    setSending(true);
    try {
      const captchaToken = turnstile.token;
      const response =
        purpose === "forget-password"
          ? await authClient.emailOtp.requestPasswordReset({
              email,
              ...(captchaToken
                ? { fetchOptions: captchaFetchOptions(captchaToken) }
                : {}),
            })
          : await authClient.emailOtp.sendVerificationOtp({
              email,
              type: "email-verification",
            });

      if (response.error?.message) {
        toast.error(
          isCaptchaError(response.error)
            ? t("auth.captcha.error")
            : purpose === "forget-password"
              ? t("auth.forgotPassword.error")
              : t("auth.emailOtp.errors.error"),
        );
        return false;
      }
      autoSendCompleted.add(emailKey);
      setSent(true);
      setCooldown(60);
      toast.success(
        purpose === "forget-password"
          ? t("auth.forgotPassword.success")
          : t("auth.verification.success"),
      );
      return true;
    } catch (error) {
      console.error(error);
      toast.error(
        purpose === "forget-password"
          ? t("auth.forgotPassword.error")
          : t("auth.emailOtp.errors.error"),
      );
      return false;
    } finally {
      if (opts?.fromAutoSend) {
        autoSendInFlight.delete(emailKey);
      }
      if (requiresCaptcha) {
        turnstile.reset();
      }
      setSending(false);
    }
  };

  useEffect(() => {
    if (!autoSend || !email) return;
    if (autoSendCompleted.has(emailKey) || autoSendInFlight.has(emailKey)) {
      if (autoSendCompleted.has(emailKey)) setSent(true);
      return;
    }
    if (requiresCaptcha && !turnstile.token) return;
    autoSendInFlight.add(emailKey);
    void sendCode({ fromAutoSend: true });
  }, [autoSend, emailKey, requiresCaptcha, turnstile.token]);

  const verify = async () => {
    if (otp.length !== 6) return;
    setVerifying(true);
    try {
      const response =
        purpose === "forget-password"
          ? await authClient.emailOtp.checkVerificationOtp({
              email,
              otp,
              type: "forget-password",
            })
          : await authClient.emailOtp.verifyEmail({
              email,
              otp,
            });
      if (response.error?.message) {
        toast.error(t("auth.emailOtp.errors.invalidCode"));
        return;
      }
      // Email-verification consumes the OTP; forget-password check does not, so
      // keep the "already sent" marker in case we return to this step.
      if (purpose === "email-verification") {
        autoSendCompleted.delete(emailKey);
        autoSendInFlight.delete(emailKey);
      }
      await onVerified(otp);
    } catch (error) {
      console.error(error);
      toast.error(t("auth.emailOtp.errors.invalidCode"));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="space-y-1 text-center">
        <p className="font-medium">{t("auth.emailOtp.title")}</p>
        <p className="text-sm text-muted-foreground">
          {t("auth.emailOtp.description")}
        </p>
        <p className="text-sm font-medium">{email}</p>
      </div>
      {sent ? (
        <form
          className="flex w-full flex-col items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
        >
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (otp.length === 6 && !verifying) void verify();
            }}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }, (_, i) => (
                <InputOTPSlot key={i} index={i} className="size-10" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <Button
            type="submit"
            className="w-full"
            variant="primary"
            disabled={otp.length !== 6 || verifying}
          >
            {verifying ? <Spinner /> : null} {t("auth.emailOtp.verify")}
          </Button>
        </form>
      ) : null}
      {requiresCaptcha && cooldown <= 0 ? (
        <TurnstileField
          siteKey={turnstileSiteKey!}
          widgetRef={turnstile.widgetRef}
          onTokenChange={turnstile.setToken}
        />
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={
          sending ||
          cooldown > 0 ||
          (requiresCaptcha && !sent && !turnstile.token) ||
          (requiresCaptcha && sent && cooldown <= 0 && !turnstile.token)
        }
        onClick={() => void sendCode()}
      >
        {sending ? <Spinner /> : null}{" "}
        {cooldown > 0
          ? t("auth.phoneOtp.cooldown", { seconds: String(cooldown) })
          : sent
            ? t("auth.emailOtp.resendCode")
            : t("auth.emailOtp.sendCode")}
      </Button>
    </div>
  );
};

/** Mark a forget-password OTP as already sent (e.g. after email step). */
export function markEmailOtpSent(
  email: string,
  purpose: EmailOtpPurpose = "forget-password",
) {
  autoSendCompleted.add(`${purpose}:${email.toLowerCase()}`);
}
