"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  CUSTOMER_OTP_RESEND_COOLDOWN_SECONDS,
  zEmail,
  zPhone,
} from "@timelish/types";
import {
  AutoSkeleton,
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
import {
  MyCabinetPublicKeys,
  MyCabinetPublicNamespace,
  myCabinetPublicNamespace,
} from "../../../translations/types";
import {
  getAuthOptionsAction,
  requestOtpAction,
  verifyOtpAction,
} from "../actions";
import type { CustomerProfile } from "../types";

type AuthScreenProps = {
  appId?: string;
  onAuthenticated: (profile: CustomerProfile) => void;
};

export const AuthScreen = ({ onAuthenticated }: AuthScreenProps) => {
  const t = useI18n<MyCabinetPublicNamespace, MyCabinetPublicKeys>(
    myCabinetPublicNamespace,
  );

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [allowPhoneLogin, setAllowPhoneLogin] = useState(false);

  const [authType, setAuthType] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isRequestOtpLoading, setIsRequestOtpLoading] = useState(false);
  const [isVerifyOtpLoading, setIsVerifyOtpLoading] = useState(false);
  const [resendAllowedAt, setResendAllowedAt] = useState<number | null>(null);
  const [countdownNow, setCountdownNow] = useState<number>(Date.now());

  const emailValid = useMemo(() => zEmail.safeParse(email).success, [email]);
  const phoneValid = useMemo(() => zPhone.safeParse(phone).success, [phone]);
  const showEmailError = emailTouched && email.length > 0 && !emailValid;
  const showPhoneError = phoneTouched && phone.length > 0 && !phoneValid;

  useEffect(() => {
    let mounted = true;
    getAuthOptionsAction()
      .then((res) => {
        if (!mounted) return;
        setAllowPhoneLogin(res.allowPhoneOtp);
      })
      .finally(() => {
        if (mounted) setIsLoadingOptions(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!resendAllowedAt) return;
    const interval = window.setInterval(
      () => setCountdownNow(Date.now()),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [resendAllowedAt]);

  const resendSecondsLeft = resendAllowedAt
    ? Math.max(0, Math.ceil((resendAllowedAt - countdownNow) / 1000))
    : 0;
  const isResendBlocked = resendSecondsLeft > 0;

  const requestOtp = async () => {
    if (authType === "email") {
      setEmailTouched(true);
      if (!emailValid) return;
    } else {
      setPhoneTouched(true);
      if (!phoneValid) return;
    }
    setIsRequestOtpLoading(true);
    try {
      const response = await requestOtpAction(
        authType === "phone" ? { phone } : { email },
      );
      setIsOtpSent(true);
      setOtp("");
      const resendAfter =
        typeof response.resendAfter === "number"
          ? response.resendAfter
          : Date.now() + CUSTOMER_OTP_RESEND_COOLDOWN_SECONDS * 1000;
      setResendAllowedAt(resendAfter);
      setCountdownNow(Date.now());
      toast.success(t("block.auth.otpSent"));
    } catch {
      toast.error(t("block.auth.requestOtpError"));
    } finally {
      setIsRequestOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    setIsVerifyOtpLoading(true);
    try {
      const response = await verifyOtpAction(
        authType === "phone" ? { phone, otp } : { email, otp },
      );
      if (!response.success) {
        toast.error(t("block.auth.otpInvalid"));
        return;
      }
      onAuthenticated({
        name: response.name,
        email: response.email,
        phone: response.phone,
      });
    } catch {
      toast.error(t("block.auth.verifyOtpError"));
    } finally {
      setIsVerifyOtpLoading(false);
    }
  };

  const isRequestDisabled =
    isRequestOtpLoading ||
    isVerifyOtpLoading ||
    isResendBlocked ||
    (authType === "email" ? !emailValid : !phoneValid);

  return (
    <AutoSkeleton loading={isLoadingOptions}>
      <div className="max-w-lg mx-auto space-y-4 flex flex-col gap-4 justify-center items-center auth-screen-container">
        <div className="text-sm text-muted-foreground text-center auth-description">
          {allowPhoneLogin
            ? t("block.auth.descriptionEmailOrPhone")
            : t("block.auth.descriptionEmailOnly")}
        </div>

        {allowPhoneLogin && (
          <ToggleGroup
            type="single"
            separated
            size="md"
            className="w-full auth-type-toggle"
            variant="outline"
            value={authType}
            onValueChange={(value) => {
              if (value === "email" || value === "phone") {
                setAuthType(value);
                setEmailTouched(false);
                setPhoneTouched(false);
              }
            }}
          >
            <ToggleGroupItem value="email" className="auth-type-email">
              <Mail className="size-4" />
              {t("block.auth.type.email")}
            </ToggleGroupItem>
            <ToggleGroupItem value="phone" className="auth-type-phone">
              <Phone className="size-4" />
              {t("block.auth.type.phone")}
            </ToggleGroupItem>
          </ToggleGroup>
        )}

        {authType === "email" ? (
          <div className="w-full space-y-1">
            <Input
              value={email}
              type="email"
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailTouched(false);
              }}
              onBlur={() => setEmailTouched(true)}
              placeholder={t("block.auth.emailPlaceholder")}
              aria-invalid={showEmailError}
              className="auth-email-input"
            />
            {showEmailError && (
              <p className="text-sm text-destructive">
                {t("block.auth.emailInvalid")}
              </p>
            )}
          </div>
        ) : (
          <div className="w-full space-y-1">
            <PhoneInput
              value={phone}
              className="w-full auth-phone-input"
              onChange={(event) => {
                setPhone(event.target.value);
                setPhoneTouched(false);
              }}
              onBlur={() => setPhoneTouched(true)}
              label={t("block.auth.phonePlaceholder")}
            />
            {showPhoneError && (
              <p className="text-sm text-destructive">
                {t("block.auth.phoneInvalid")}
              </p>
            )}
          </div>
        )}

        <Button
          onClick={requestOtp}
          disabled={isRequestDisabled}
          className="w-full auth-request-otp-button"
        >
          {isRequestOtpLoading && <Spinner />}
          {isResendBlocked
            ? t("block.auth.requestOtpBlocked", {
                minutes: String(Math.floor(resendSecondsLeft / 60)),
                seconds: String(resendSecondsLeft % 60).padStart(2, "0"),
              })
            : t("block.auth.requestOtp")}
        </Button>

        {isOtpSent && (
          <div className="flex flex-col gap-2 items-center auth-otp-section">
            <div className="text-sm text-muted-foreground auth-otp-hint">
              {t("block.auth.otpHint")}
            </div>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              className="auth-otp-input"
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, i) => (
                  <InputOTPSlot key={i} index={i} className="size-10" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <Button
              onClick={verifyOtp}
              disabled={
                otp.length !== 6 || isVerifyOtpLoading || isRequestOtpLoading
              }
              className="w-full auth-verify-button"
            >
              {isVerifyOtpLoading && <Spinner />}
              {t("block.auth.verifyOtp")}
            </Button>
          </div>
        )}
      </div>
    </AutoSkeleton>
  );
};
