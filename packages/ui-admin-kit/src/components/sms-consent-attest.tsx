"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Checkbox } from "@hacado/ui";
import { normalizeToE164 } from "@hacado/utils";
import { useEffect, useState } from "react";

export type SmsConsentAttestStatus = "consented" | "optedOut" | "missing";

export const smsConsentAttestStatus = (status: {
  consented: boolean;
  optedOut: boolean;
}): SmsConsentAttestStatus => {
  if (status.optedOut) {
    return "optedOut";
  }

  if (status.consented) {
    return "consented";
  }

  return "missing";
};

export const useCustomerPhoneSmsConsent = (
  customerId?: string,
  phone?: string,
): SmsConsentAttestStatus | undefined => {
  const [status, setStatus] = useState<SmsConsentAttestStatus | undefined>();

  useEffect(() => {
    const normalized = normalizeToE164(phone ?? "");
    if (!customerId || !normalized) {
      setStatus(undefined);
      return;
    }

    let cancelled = false;
    setStatus(undefined);
    adminApi.customers
      .getCustomerSmsConsent(customerId, normalized)
      .then((result) => {
        if (!cancelled) setStatus(smsConsentAttestStatus(result));
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [customerId, phone]);

  return status;
};

export const SmsConsentAttest = ({
  phone,
  status,
  checked,
  onCheckedChange,
  disabled,
  id = "sms-consent-attest",
  required = false,
}: {
  phone?: string | null;
  status?: SmsConsentAttestStatus;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  required?: boolean;
}) => {
  const t = useI18n("admin");
  if (!normalizeToE164(phone ?? "") || !status) {
    return null;
  }

  if (status === "consented") {
    return (
      <p className="text-sm text-muted-foreground">{t("smsConsent.already")}</p>
    );
  }

  if (status === "optedOut") {
    return (
      <p className="text-sm text-muted-foreground">
        {t("smsConsent.optedOut")}
      </p>
    );
  }

  return (
    <div className="flex flex-row items-center gap-2">
      <Checkbox
        id={id}
        disabled={disabled}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <label htmlFor={id} className="text-sm cursor-pointer">
        {t("smsConsent.attest")}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
    </div>
  );
};
