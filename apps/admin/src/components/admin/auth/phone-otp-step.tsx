"use client";

import {
  requestMemberPhoneOtpAction,
  verifyMemberPhoneOtpAction,
} from "@/app/auth/phone-otp/actions";
import type {
  MemberPhoneOtpContext,
  MemberPhoneOtpErrorCode,
} from "@/lib/auth/member-phone-otp";
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

/** Survives React Strict Mode remounts so auto-send only fires once per phone. */
const autoSendInFlight = new Set<string>();
const autoSendCompleted = new Set<string>();

function autoSendKey(phone: string, kind: string) {
  return `${kind}:${phone}`;
}

function errorMessage(
  t: ReturnType<typeof useI18n<"admin">>,
  code: MemberPhoneOtpErrorCode,
): string {
  const map: Record<MemberPhoneOtpErrorCode, Parameters<typeof t>[0]> = {
    phone_in_use: "auth.phoneOtp.errors.phoneInUse",
    rate_limited: "auth.phoneOtp.errors.rateLimited",
    cooldown: "auth.phoneOtp.errors.cooldown",
    invalid_code: "auth.phoneOtp.errors.invalidCode",
    expired: "auth.phoneOtp.errors.expired",
    too_many_attempts: "auth.phoneOtp.errors.tooManyAttempts",
    sms_failed: "auth.phoneOtp.errors.smsFailed",
    not_verified: "auth.phoneOtp.errors.notVerified",
    invalid_phone: "auth.phoneOtp.errors.invalidPhone",
  };
  return t(map[code]);
}

export const PhoneOtpStep = ({
  phone,
  kind,
  onVerified,
  autoSend = true,
}: {
  phone: string;
  kind: MemberPhoneOtpContext["kind"];
  onVerified: (phone: string) => void | Promise<void>;
  autoSend?: boolean;
}) => {
  const t = useI18n("admin");
  const sendKey = autoSendKey(phone, kind);
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(() => autoSendCompleted.has(sendKey));
  const [cooldown, setCooldown] = useState(() =>
    autoSendCompleted.has(sendKey) ? 60 : 0,
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const sendCode = async (opts?: { fromAutoSend?: boolean }) => {
    setSending(true);
    try {
      const result = await requestMemberPhoneOtpAction(phone, kind);
      if (!result.ok) {
        toast.error(errorMessage(t, result.code));
        return false;
      }
      autoSendCompleted.add(sendKey);
      setSent(true);
      setCooldown(result.cooldownSeconds ?? 60);
      toast.success(t("users.profile.phoneChange.toasts.codeSent"));
      return true;
    } finally {
      if (opts?.fromAutoSend) {
        autoSendInFlight.delete(sendKey);
      }
      setSending(false);
    }
  };

  useEffect(() => {
    if (!autoSend || !phone) return;
    if (autoSendCompleted.has(sendKey) || autoSendInFlight.has(sendKey)) {
      if (autoSendCompleted.has(sendKey)) setSent(true);
      return;
    }
    autoSendInFlight.add(sendKey);
    void sendCode({ fromAutoSend: true });
  }, [autoSend, sendKey]);

  const verify = async () => {
    if (otp.length !== 6) return;
    setVerifying(true);
    try {
      const result = await verifyMemberPhoneOtpAction(phone, otp, kind);
      if (!result.ok) {
        toast.error(errorMessage(t, result.code));
        return;
      }
      autoSendCompleted.delete(sendKey);
      autoSendInFlight.delete(sendKey);
      await onVerified(phone);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="space-y-1 text-center">
        <p className="font-medium">{t("auth.phoneOtp.title")}</p>
        <p className="text-sm text-muted-foreground">
          {t("auth.phoneOtp.description")}
        </p>
        <p className="text-sm font-medium">{phone}</p>
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
            {verifying ? <Spinner /> : null} {t("auth.phoneOtp.verify")}
          </Button>
        </form>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={sending || cooldown > 0}
        onClick={() => void sendCode()}
      >
        {sending ? <Spinner /> : null}{" "}
        {cooldown > 0
          ? t("auth.phoneOtp.cooldown", { seconds: String(cooldown) })
          : sent
            ? t("auth.phoneOtp.resendCode")
            : t("auth.phoneOtp.sendCode")}
      </Button>
    </div>
  );
};
