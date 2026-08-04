"use client";

import { clientApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import {
  CUSTOMER_OTP_RESEND_COOLDOWN_SECONDS,
  zEmail,
  zPhone,
} from "@timelish/types";
import {
  Button,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  PhoneInput,
  Spinner,
  ToggleGroup,
  ToggleGroupItem,
  toast,
} from "@timelish/ui";
import { Mail, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useModifyAppointmentFormContext } from "./context";

export const OtpCard: React.FC = () => {
  const t = useI18n("translation");
  const { setStep, setIsOtpVerified } = useModifyAppointmentFormContext();

  const [allowPhoneOtp, setAllowPhoneOtp] = useState(false);
  const [authType, setAuthType] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isRequestOtpLoading, setIsRequestOtpLoading] = useState(false);
  const [isVerifyOtpLoading, setIsVerifyOtpLoading] = useState(false);
  const [resendAllowedAt, setResendAllowedAt] = useState<number | null>(null);
  const [countdownNow, setCountdownNow] = useState(Date.now());

  const emailValid = useMemo(() => zEmail.safeParse(email).success, [email]);
  const phoneValid = useMemo(() => zPhone.safeParse(phone).success, [phone]);

  useEffect(() => {
    clientApi.customerAuth
      .getAuthOptions()
      .then((res) => setAllowPhoneOtp(res.allowPhoneOtp))
      .catch(() => setAllowPhoneOtp(false));
  }, []);

  useEffect(() => {
    if (!resendAllowedAt) return;
    const id = setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [resendAllowedAt]);

  const resendSecondsLeft = resendAllowedAt
    ? Math.max(0, Math.ceil((resendAllowedAt - countdownNow) / 1000))
    : 0;
  const isResendBlocked = resendSecondsLeft > 0;

  const isRequestDisabled =
    isRequestOtpLoading ||
    isVerifyOtpLoading ||
    isResendBlocked ||
    (authType === "email" ? !emailValid : !phoneValid);

  const requestOtp = async () => {
    if (authType === "email" && !emailValid) return;
    if (authType === "phone" && !phoneValid) return;
    setIsRequestOtpLoading(true);
    try {
      const response = await clientApi.customerAuth.requestOtp(
        authType === "phone" ? { phone } : { email },
      );
      setIsOtpSent(true);
      setOtp("");
      setResendAllowedAt(
        typeof response.resendAfter === "number"
          ? response.resendAfter
          : Date.now() + CUSTOMER_OTP_RESEND_COOLDOWN_SECONDS * 1000,
      );
      setCountdownNow(Date.now());
      toast.success(t("modification.otp.sent"));
    } catch {
      toast.error(t("modification.otp.requestError"));
    } finally {
      setIsRequestOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    setIsVerifyOtpLoading(true);
    try {
      await clientApi.customerAuth.verifyOtp(
        authType === "phone" ? { phone, otp } : { email, otp },
      );
      setIsOtpVerified(true);
      setStep("form");
    } catch {
      toast.error(t("modification.otp.invalid"));
    } finally {
      setIsVerifyOtpLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {allowPhoneOtp
          ? t("modification.otp.descriptionEmailOrPhone")
          : t("modification.otp.descriptionEmailOnly")}
      </p>
      {allowPhoneOtp && (
        <ToggleGroup
          type="single"
          value={authType}
          onValueChange={(v) => v && setAuthType(v as "email" | "phone")}
          className="w-full border"
        >
          <ToggleGroupItem value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            {t("modification.otp.email")}
          </ToggleGroupItem>
          <ToggleGroupItem value="phone" className="gap-2">
            <Phone className="h-4 w-4" />
            {t("modification.otp.phone")}
          </ToggleGroupItem>
        </ToggleGroup>
      )}
      {authType === "email" ? (
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("modification.otp.emailPlaceholder")}
        />
      ) : (
        <PhoneInput
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          label={t("modification.otp.phone")}
        />
      )}
      <Button
        className="w-full"
        onClick={requestOtp}
        disabled={isRequestDisabled}
      >
        {isRequestOtpLoading && <Spinner />}
        {isResendBlocked
          ? t("modification.otp.resendBlocked", {
              minutes: String(Math.floor(resendSecondsLeft / 60)),
              seconds: String(resendSecondsLeft % 60).padStart(2, "0"),
            })
          : t("modification.otp.request")}
      </Button>
      {isOtpSent && (
        <div className="flex flex-col gap-2 items-center justify-center w-full">
          <p className="text-sm text-muted-foreground text-center">
            {t("modification.otp.hint")}
          </p>
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <Button
            className="w-full"
            onClick={verifyOtp}
            disabled={
              otp.length !== 6 || isVerifyOtpLoading || isRequestOtpLoading
            }
          >
            {isVerifyOtpLoading && <Spinner />}
            {t("modification.otp.verify")}
          </Button>
        </div>
      )}
    </div>
  );
};
