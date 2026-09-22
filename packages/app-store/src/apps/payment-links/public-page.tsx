"use client";

import { clientApi } from "@hacado/api-sdk";
import { PaymentAppForms } from "@hacado/app-store/payment-forms";
import { useI18n } from "@hacado/i18n/client";
import {
  CollectPayment,
  PublicPageRendererProps,
  zEmail,
  zPhone,
} from "@hacado/types";
import {
  Button,
  CustomerOtpForm,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  PhoneInput,
  Spinner,
  ToggleGroup,
  ToggleGroupItem,
  useCurrencyFormat,
  useCurrencySymbol,
} from "@hacado/ui";
import { Mail, Phone } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  PaymentLinksPublicKeys,
  PaymentLinksPublicNamespace,
  paymentLinksPublicNamespace,
} from "./translations/types";

type PaymentPublicInfo = {
  publicId: string;
  amount: number;
  amountFormatted: string;
  description: string;
  type?: string;
  status: "pending" | "paid" | "cancelled" | "refunded" | "expired";
  expiresAt?: string | Date;
};

type TipsConfig = {
  enabled: boolean;
  presets: number[];
};

type LoadResponse = {
  success: boolean;
  payment?: PaymentPublicInfo;
  tips?: TipsConfig;
  verification?: "none" | "contact-match" | "otp";
  verified?: boolean;
  code?: string;
};

type TipMode = "none" | "preset" | "custom";

type ViewState =
  | "loading"
  | "error"
  | "missing"
  | "status"
  | "verify-contact"
  | "verify-otp"
  | "pay"
  | "success";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export const PaymentLinksPublicPage: React.FC<PublicPageRendererProps> = ({
  appId,
  searchParams,
}) => {
  const t = useI18n<PaymentLinksPublicNamespace, PaymentLinksPublicKeys>(
    paymentLinksPublicNamespace,
  );
  const currencyFormat = useCurrencyFormat();

  const publicIdParam = searchParams?.id;
  const publicId = Array.isArray(publicIdParam)
    ? publicIdParam[0]
    : publicIdParam;

  const [view, setView] = useState<ViewState>("loading");
  const [payment, setPayment] = useState<PaymentPublicInfo | null>(null);
  const [tipsConfig, setTipsConfig] = useState<TipsConfig>({
    enabled: false,
    presets: [],
  });
  const [verification, setVerification] = useState<
    "none" | "contact-match" | "otp"
  >("none");
  const [collectPayment, setCollectPayment] = useState<CollectPayment | null>(
    null,
  );
  const [contactChannel, setContactChannel] = useState<"email" | "phone">(
    "email",
  );
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmailTouched, setContactEmailTouched] = useState(false);
  const [contactPhoneTouched, setContactPhoneTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tipMode, setTipMode] = useState<TipMode>("none");
  const [tipPresetPercent, setTipPresetPercent] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState("");
  const currencySymbol = useCurrencySymbol();

  const tipAmount = useMemo(() => {
    if (!tipsConfig.enabled || !payment) {
      return 0;
    }
    if (tipMode === "none") {
      return 0;
    }
    if (tipMode === "preset" && tipPresetPercent != null) {
      return roundMoney((payment.amount * tipPresetPercent) / 100);
    }
    if (tipMode === "custom") {
      const parsed = Number(customTip);
      return Number.isFinite(parsed) && parsed > 0 ? roundMoney(parsed) : 0;
    }
    return 0;
  }, [tipsConfig.enabled, payment, tipMode, tipPresetPercent, customTip]);

  const totalAmount = useMemo(() => {
    if (!payment) return 0;
    return roundMoney(payment.amount + tipAmount);
  }, [payment, tipAmount]);

  const loadPayment = useCallback(async () => {
    if (!publicId) {
      setView("missing");
      return;
    }

    setView("loading");
    setErrorMessage(null);

    try {
      const data = await clientApi.apps.callAppApi<LoadResponse>({
        appId,
        path: `public/${encodeURIComponent(publicId)}`,
        method: "GET",
      });

      if (!data.success || !data.payment) {
        setView("error");
        return;
      }

      setPayment(data.payment);
      setTipsConfig({
        enabled: !!data.tips?.enabled,
        presets: data.tips?.presets ?? [],
      });

      setTipMode("none");
      setTipPresetPercent(null);
      setCustomTip("");
      setVerification(data.verification ?? "none");

      if (
        data.payment.status === "paid" ||
        data.payment.status === "cancelled" ||
        data.payment.status === "expired" ||
        data.payment.status === "refunded"
      ) {
        setView("status");
        return;
      }

      if (data.verified || data.verification === "none") {
        setView("pay");
        return;
      }

      if (data.verification === "contact-match") {
        setView("verify-contact");
        return;
      }

      setView("verify-otp");
    } catch {
      setView("error");
    }
  }, [appId, publicId]);

  useEffect(() => {
    void loadPayment();
  }, [loadPayment]);

  const [debouncedTipAmount, setDebouncedTipAmount] = useState(0);

  useEffect(() => {
    const handle = window.setTimeout(
      () => {
        setDebouncedTipAmount(tipAmount);
      },
      tipMode === "custom" ? 400 : 0,
    );

    return () => window.clearTimeout(handle);
  }, [tipAmount, tipMode]);

  const startIntent = useCallback(
    async (nextTipAmount: number) => {
      if (!publicId) return;

      setBusy(true);
      setErrorMessage(null);

      try {
        const data = await clientApi.apps.callAppApi<
          CollectPayment & { success?: boolean; code?: string }
        >({
          appId,
          path: "intent",
          method: "POST",
          body: { publicId, tipAmount: nextTipAmount },
        });

        if (!data.intent) {
          setErrorMessage(t("payment.error"));
          setCollectPayment(null);
          return;
        }

        setCollectPayment(data);
      } catch {
        setErrorMessage(t("payment.error"));
        setCollectPayment(null);
      } finally {
        setBusy(false);
      }
    },
    [appId, publicId, t],
  );

  useEffect(() => {
    if (view !== "pay") {
      return;
    }

    void startIntent(debouncedTipAmount);
  }, [view, debouncedTipAmount, startIntent]);

  const onVerifyContact = async () => {
    if (!publicId) return;

    setBusy(true);
    setErrorMessage(null);

    try {
      const data = await clientApi.apps.callAppApi<{
        success: boolean;
        code?: string;
      }>({
        appId,
        path: "verify-contact",
        method: "POST",
        body: {
          publicId,
          ...(contactChannel === "email"
            ? { email: contactEmail }
            : { phone: contactPhone }),
        },
      });

      if (!data.success) {
        setErrorMessage(
          data.code === "mismatch"
            ? t("verification.contactMatch.mismatch")
            : t("verification.contactMatch.error"),
        );
        return;
      }

      setView("pay");
    } catch {
      setErrorMessage(t("verification.contactMatch.error"));
    } finally {
      setBusy(false);
    }
  };

  const onPaymentSubmit = async () => {
    if (!publicId || !collectPayment?.intent?._id) return;

    setBusy(true);
    setErrorMessage(null);

    try {
      const data = await clientApi.apps.callAppApi<{
        success: boolean;
      }>({
        appId,
        path: "complete",
        method: "POST",
        body: {
          publicId,
          intentId: collectPayment.intent._id,
        },
      });

      if (!data.success) {
        setErrorMessage(t("payment.completeError"));
        return;
      }

      setPayment((prev) => (prev ? { ...prev, status: "paid" } : prev));
      setView("success");
    } catch {
      setErrorMessage(t("payment.completeError"));
    } finally {
      setBusy(false);
    }
  };

  const selectNoneTip = () => {
    setTipMode("none");
    setTipPresetPercent(null);
    setCustomTip("");
  };

  const selectPresetTip = (percent: number) => {
    setTipMode("preset");
    setTipPresetPercent(percent);
    setCustomTip("");
  };

  const selectCustomTip = () => {
    setTipMode("custom");
    setTipPresetPercent(null);
  };

  if (view === "loading") {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (view === "missing") {
    return (
      <StatusBlock title={t("page.title")} description={t("page.missingId")} />
    );
  }

  if (view === "error") {
    return (
      <StatusBlock title={t("page.title")} description={t("page.loadError")} />
    );
  }

  if (view === "success" || (view === "status" && payment)) {
    const statusKey =
      payment?.status === "paid" || view === "success"
        ? "paid"
        : payment?.status === "cancelled"
          ? "cancelled"
          : payment?.status === "expired"
            ? "expired"
            : "paid";

    return (
      <StatusBlock
        title={t(`status.${statusKey}.title`)}
        description={
          statusKey === "paid"
            ? t("status.paid.description")
            : t(`status.${statusKey}.description`)
        }
      />
    );
  }

  if (view === "verify-contact") {
    const emailValid = zEmail.safeParse(contactEmail).success;
    const phoneValid = zPhone.safeParse(contactPhone).success;
    const contactValid = contactChannel === "email" ? emailValid : phoneValid;
    const showEmailError =
      contactEmailTouched && contactEmail.length > 0 && !emailValid;
    const showPhoneError =
      contactPhoneTouched && contactPhone.length > 0 && !phoneValid;

    const onSubmitContact = (event: FormEvent) => {
      event.preventDefault();
      if (contactChannel === "email") {
        setContactEmailTouched(true);
      } else {
        setContactPhoneTouched(true);
      }
      if (!contactValid || busy) {
        return;
      }
      void onVerifyContact();
    };

    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-semibold">
          {t("verification.contactMatch.title")}
        </h1>
        <form
          onSubmit={onSubmitContact}
          className="flex w-full flex-col items-center gap-4"
        >
          <div className="text-center text-sm text-muted-foreground">
            {t("verification.contactMatch.description")}
          </div>
          <ToggleGroup
            type="single"
            separated
            size="md"
            className="w-full"
            variant="outline"
            value={contactChannel}
            onValueChange={(value) => {
              if (value === "email" || value === "phone") {
                setContactChannel(value);
                setContactEmailTouched(false);
                setContactPhoneTouched(false);
                setErrorMessage(null);
              }
            }}
          >
            <ToggleGroupItem value="email">
              <Mail className="size-4" />
              {t("verification.contactMatch.email")}
            </ToggleGroupItem>
            <ToggleGroupItem value="phone">
              <Phone className="size-4" />
              {t("verification.contactMatch.phone")}
            </ToggleGroupItem>
          </ToggleGroup>
          {contactChannel === "email" ? (
            <div className="w-full space-y-1">
              <Input
                value={contactEmail}
                type="email"
                disabled={busy}
                onChange={(event) => {
                  setContactEmail(event.target.value);
                  setContactEmailTouched(false);
                  setErrorMessage(null);
                }}
                onBlur={() => setContactEmailTouched(true)}
                placeholder={t("verification.contactMatch.emailPlaceholder")}
                aria-invalid={showEmailError}
              />
              {showEmailError && (
                <p className="text-sm text-destructive">
                  {t("verification.contactMatch.emailInvalid")}
                </p>
              )}
            </div>
          ) : (
            <div className="w-full space-y-1">
              <PhoneInput
                value={contactPhone}
                className="w-full"
                disabled={busy}
                onChange={(event) => {
                  setContactPhone(event.target.value);
                  setContactPhoneTouched(false);
                  setErrorMessage(null);
                }}
                onBlur={() => setContactPhoneTouched(true)}
                label={t("verification.contactMatch.phonePlaceholder")}
              />
              {showPhoneError && (
                <p className="text-sm text-destructive">
                  {t("verification.contactMatch.phoneInvalid")}
                </p>
              )}
            </div>
          )}
          {errorMessage && (
            <p className="w-full text-sm text-destructive">{errorMessage}</p>
          )}
          <Button
            type="submit"
            disabled={busy || !contactValid}
            className="w-full"
          >
            {busy && <Spinner />}
            {t("verification.contactMatch.submit")}
          </Button>
        </form>
      </div>
    );
  }

  if (view === "verify-otp") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-semibold">{t("status.pending.title")}</h1>
        <CustomerOtpForm
          getAuthOptions={() => clientApi.customerAuth.getAuthOptions()}
          requestOtp={({ channel, email, phone }) =>
            clientApi.customerAuth.requestOtp(
              channel === "phone" ? { phone } : { email },
            )
          }
          verifyOtp={({ channel, email, phone, otp }) =>
            clientApi.customerAuth.verifyOtp(
              channel === "phone" ? { phone, otp } : { email, otp },
            )
          }
          onVerified={() => {
            setView("pay");
          }}
          labels={{
            descriptionEmailOnly: t("verification.otp.descriptionEmailOnly"),
            descriptionPhoneOnly: t("verification.otp.descriptionPhoneOnly"),
            descriptionEmailOrPhone: t(
              "verification.otp.descriptionEmailOrPhone",
            ),
            email: t("verification.otp.email"),
            phone: t("verification.otp.phone"),
            emailPlaceholder: t("verification.otp.emailPlaceholder"),
            phonePlaceholder: t("verification.otp.phonePlaceholder"),
            emailInvalid: t("verification.otp.emailInvalid"),
            phoneInvalid: t("verification.otp.phoneInvalid"),
            request: t("verification.otp.request"),
            requestBlocked: (values) =>
              t("verification.otp.requestBlocked", values),
            hint: t("verification.otp.hint"),
            verify: t("verification.otp.verify"),
            sent: t("verification.otp.sent"),
            invalid: t("verification.otp.invalid"),
            requestError: t("verification.otp.requestError"),
            verifyError: t("verification.otp.verifyError"),
          }}
        />
      </div>
    );
  }

  const Form =
    collectPayment?.intent?.appName &&
    PaymentAppForms[collectPayment.intent.appName];

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">{t("status.pending.title")}</h1>
      {payment && (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{t("page.amount")}</span>
            <span className="font-medium">
              {payment.amountFormatted || currencyFormat(payment.amount)}
            </span>
          </div>
          {payment.description && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                {t("page.description")}
              </span>
              <span className="text-right">
                {t.has(payment.description as PaymentLinksPublicKeys)
                  ? t(payment.description as PaymentLinksPublicKeys)
                  : payment.description}
              </span>
            </div>
          )}
        </div>
      )}
      {tipsConfig.enabled && payment && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">{t("tips.title")}</p>
          <div className="flex flex-wrap gap-2 justify-between">
            <Button
              type="button"
              size="sm"
              variant={tipMode === "none" ? "default" : "outline"}
              onClick={selectNoneTip}
              disabled={busy}
            >
              {t("tips.none")}
            </Button>
            {tipsConfig.presets.map((percent) => (
              <Button
                key={percent}
                type="button"
                size="sm"
                variant={
                  tipMode === "preset" && tipPresetPercent === percent
                    ? "default"
                    : "outline"
                }
                onClick={() => selectPresetTip(percent)}
                disabled={busy}
              >
                {t("tips.preset", { percent })}
              </Button>
            ))}
            <Button
              type="button"
              size="sm"
              variant={tipMode === "custom" ? "default" : "outline"}
              onClick={selectCustomTip}
              disabled={busy}
            >
              {t("tips.custom")}
            </Button>
          </div>
          {tipMode === "custom" && (
            <InputGroup>
              <InputGroupAddon
                className={InputGroupAddonClasses({
                  variant: "prefix",
                })}
              >
                {currencySymbol}
              </InputGroupAddon>
              <InputGroupInput>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={t("tips.customAmount")}
                  value={customTip}
                  onChange={(e) => {
                    setCustomTip(e.target.value);
                  }}
                  disabled={busy}
                  className={InputGroupInputClasses({
                    variant: "prefix",
                  })}
                />
              </InputGroupInput>
            </InputGroup>
          )}
          <div className="flex flex-col gap-1 text-sm border-t pt-3">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t("page.tip")}</span>
              <span>{currencyFormat(tipAmount)}</span>
            </div>
            <div className="flex justify-between gap-4 font-medium">
              <span>{t("page.total")}</span>
              <span className="font-bold text-lg">
                {currencyFormat(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
      {errorMessage && (
        <p className="text-destructive text-sm">{errorMessage}</p>
      )}
      {busy && !Form && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
      {Form && collectPayment && (
        <Form
          {...collectPayment.formProps}
          intent={collectPayment.intent}
          onSubmit={() => void onPaymentSubmit()}
        />
      )}
    </div>
  );
};

const StatusBlock: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-4 py-16 text-center">
    <h1 className="text-2xl font-semibold">{title}</h1>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);
