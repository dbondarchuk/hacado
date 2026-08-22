"use client";

import {
  CUSTOMER_OTP_RESEND_COOLDOWN_SECONDS,
  zEmail,
  zPhone,
  type CustomerOtpChannels,
} from "@hacado/types";
import { Mail, Phone } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AutoSkeleton } from "./auto-skeleton";
import { Button } from "./button";
import { Input } from "./input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./input-otp";
import { PhoneInput } from "./phone-input";
import { Spinner } from "./spinner";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

export type CustomerOtpChannel = "email" | "phone";

export type CustomerOtpFormLabels = {
  descriptionEmailOnly: string;
  descriptionPhoneOnly: string;
  descriptionEmailOrPhone: string;
  email: string;
  phone: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
  emailInvalid: string;
  phoneInvalid: string;
  request: string;
  requestBlocked: (values: { minutes: string; seconds: string }) => string;
  hint: string;
  verify: string;
  sent: string;
  invalid: string;
  requestError: string;
  verifyError: string;
};

export type CustomerOtpRequestPayload = {
  channel: CustomerOtpChannel;
  email: string;
  phone: string;
};

export type CustomerOtpVerifyPayload = CustomerOtpRequestPayload & {
  otp: string;
};

export type CustomerOtpVerified = {
  email: string;
  phone: string;
  name?: string;
  id?: string;
};

export type CustomerOtpFormProps = {
  initialEmail?: string;
  initialPhone?: string;
  autoSend?: boolean;
  /** When true, use initial email/phone and do not show contact inputs. */
  hideContactFields?: boolean;
  labels: CustomerOtpFormLabels;
  getAuthOptions: () => Promise<{
    otpChannels?: CustomerOtpChannels;
  }>;
  requestOtp: (
    payload: CustomerOtpRequestPayload,
  ) => Promise<{ resendAfter?: number }>;
  verifyOtp: (payload: CustomerOtpVerifyPayload) => Promise<{
    success?: boolean;
    name?: string;
    email?: string;
    phone?: string;
    id?: string;
  }>;
  onVerified: (result: CustomerOtpVerified) => void | Promise<void>;
};

export const CustomerOtpForm = ({
  initialEmail = "",
  initialPhone = "",
  autoSend = false,
  hideContactFields = false,
  labels,
  getAuthOptions,
  requestOtp,
  verifyOtp,
  onVerified,
}: CustomerOtpFormProps) => {
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [otpChannels, setOtpChannels] = useState<CustomerOtpChannels>("email");
  const [authType, setAuthType] = useState<CustomerOtpChannel>("email");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isRequestOtpLoading, setIsRequestOtpLoading] = useState(false);
  const [isVerifyOtpLoading, setIsVerifyOtpLoading] = useState(false);
  const [resendAllowedAt, setResendAllowedAt] = useState<number | null>(null);
  const [countdownNow, setCountdownNow] = useState(Date.now());
  const autoSendStarted = useRef(false);

  const emailValid = useMemo(() => zEmail.safeParse(email).success, [email]);
  const phoneValid = useMemo(() => zPhone.safeParse(phone).success, [phone]);
  const showEmailError = emailTouched && email.length > 0 && !emailValid;
  const showPhoneError = phoneTouched && phone.length > 0 && !phoneValid;
  const contactValid = authType === "email" ? emailValid : phoneValid;
  const showChannelToggle =
    otpChannels === "email_or_phone" &&
    (!hideContactFields || (emailValid && phoneValid));

  const description =
    otpChannels === "phone"
      ? labels.descriptionPhoneOnly
      : otpChannels === "email_or_phone"
        ? labels.descriptionEmailOrPhone
        : labels.descriptionEmailOnly;

  useEffect(() => {
    let mounted = true;
    getAuthOptions()
      .then((res) => {
        if (!mounted) return;
        const channels = res.otpChannels ?? "email";
        setOtpChannels(channels);

        if (channels === "phone") {
          setAuthType("phone");
        } else if (
          channels === "email_or_phone" &&
          !zEmail.safeParse(initialEmail).success &&
          zPhone.safeParse(initialPhone).success
        ) {
          setAuthType("phone");
        } else {
          setAuthType("email");
        }
      })
      .catch(() => {
        if (mounted) {
          setOtpChannels("email");
          setAuthType("email");
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingOptions(false);
      });
    return () => {
      mounted = false;
    };
    // Load options once; callers typically pass an inline getAuthOptions.
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

  const sendOtp = async () => {
    if (authType === "email") {
      setEmailTouched(true);
      if (!emailValid) return;
    } else {
      setPhoneTouched(true);
      if (!phoneValid) return;
    }
    setIsRequestOtpLoading(true);
    try {
      const response = await requestOtp({
        channel: authType,
        email,
        phone,
      });
      setIsOtpSent(true);
      setOtp("");
      const resendAfter =
        typeof response.resendAfter === "number"
          ? response.resendAfter
          : Date.now() + CUSTOMER_OTP_RESEND_COOLDOWN_SECONDS * 1000;
      setResendAllowedAt(resendAfter);
      setCountdownNow(Date.now());
      toast.success(labels.sent);
    } catch {
      toast.error(labels.requestError);
    } finally {
      setIsRequestOtpLoading(false);
    }
  };

  useEffect(() => {
    if (
      !autoSend ||
      isLoadingOptions ||
      autoSendStarted.current ||
      !contactValid
    ) {
      return;
    }
    autoSendStarted.current = true;
    void sendOtp();
    // Auto-send once after auth options load and the selected contact is valid.
  }, [autoSend, isLoadingOptions, contactValid, authType]);

  const handleVerify = async () => {
    setIsVerifyOtpLoading(true);
    try {
      const response = await verifyOtp({
        channel: authType,
        email,
        phone,
        otp,
      });
      if (response.success === false) {
        toast.error(labels.invalid);
        return;
      }
      await onVerified({
        email: response.email ?? email,
        phone: response.phone ?? phone,
        name: response.name,
        id: response.id,
      });
    } catch {
      toast.error(labels.verifyError);
    } finally {
      setIsVerifyOtpLoading(false);
    }
  };

  const isRequestDisabled =
    isRequestOtpLoading ||
    isVerifyOtpLoading ||
    isResendBlocked ||
    !contactValid;

  const handleRequestSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isRequestDisabled) return;
    void sendOtp();
  };

  return (
    <AutoSkeleton loading={isLoadingOptions}>
      <form
        onSubmit={handleRequestSubmit}
        className="max-w-lg mx-auto space-y-4 flex flex-col gap-4 justify-center items-center auth-screen-container"
      >
        <div className="text-sm text-muted-foreground text-center auth-description">
          {description}
        </div>

        {showChannelToggle && (
          <ToggleGroup
            type="single"
            separated
            size="md"
            className={
              hideContactFields
                ? "w-full flex-col items-stretch auth-type-toggle"
                : "w-full auth-type-toggle"
            }
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
            <ToggleGroupItem
              value="email"
              className={
                hideContactFields
                  ? "h-auto w-full min-h-10 flex-col items-stretch py-2 px-3 whitespace-normal auth-type-email"
                  : "auth-type-email"
              }
            >
              {hideContactFields ? (
                labels.email
              ) : (
                <>
                  <Mail className="size-4" />
                  {labels.email}
                </>
              )}
              {hideContactFields && (
                <span className="flex items-start justify-center gap-1.5 text-xs font-normal">
                  <Mail className="size-4 mt-0.5" />
                  <span className="min-w-0 break-all text-left">{email}</span>
                </span>
              )}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="phone"
              className={
                hideContactFields
                  ? "h-auto w-full min-h-10 flex-col items-stretch py-2 px-3 whitespace-normal auth-type-phone"
                  : "auth-type-phone"
              }
            >
              {hideContactFields ? (
                labels.phone
              ) : (
                <>
                  <Phone className="size-4" />
                  {labels.phone}
                </>
              )}
              {hideContactFields && (
                <span className="flex items-start justify-center gap-1.5 text-xs font-normal">
                  <Phone className="size-4 mt-0.5" />
                  <span className="min-w-0 break-all text-left">{phone}</span>
                </span>
              )}
            </ToggleGroupItem>
          </ToggleGroup>
        )}

        {hideContactFields ? (
          !showChannelToggle && (
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              {authType === "email" ? (
                <>
                  <Mail className="size-4 shrink-0" />
                  <span className="break-all">{email}</span>
                </>
              ) : (
                <>
                  <Phone className="size-4 shrink-0" />
                  <span className="break-all">{phone}</span>
                </>
              )}
            </div>
          )
        ) : authType === "email" ? (
          <div className="w-full space-y-1">
            <Input
              value={email}
              type="email"
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailTouched(false);
              }}
              onBlur={() => setEmailTouched(true)}
              placeholder={labels.emailPlaceholder}
              aria-invalid={showEmailError}
              className="auth-email-input"
            />
            {showEmailError && (
              <p className="text-sm text-destructive">{labels.emailInvalid}</p>
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
              label={labels.phonePlaceholder}
            />
            {showPhoneError && (
              <p className="text-sm text-destructive">{labels.phoneInvalid}</p>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={isRequestDisabled}
          className="w-full auth-request-otp-button"
        >
          {isRequestOtpLoading && <Spinner />}
          {isResendBlocked
            ? labels.requestBlocked({
                minutes: String(Math.floor(resendSecondsLeft / 60)),
                seconds: String(resendSecondsLeft % 60).padStart(2, "0"),
              })
            : labels.request}
        </Button>

        {isOtpSent && (
          <div className="flex flex-col gap-2 items-center auth-otp-section">
            <div className="text-sm text-muted-foreground auth-otp-hint">
              {labels.hint}
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
              type="button"
              onClick={() => void handleVerify()}
              disabled={
                otp.length !== 6 || isVerifyOtpLoading || isRequestOtpLoading
              }
              className="w-full auth-verify-button"
            >
              {isVerifyOtpLoading && <Spinner />}
              {labels.verify}
            </Button>
          </div>
        )}
      </form>
    </AutoSkeleton>
  );
};
