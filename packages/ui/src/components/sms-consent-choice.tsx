"use client";

import { useI18n } from "@hacado/i18n/client";
import type { CustomerAppointmentTextOffer } from "@hacado/types/apps";
import { normalizeToE164 } from "@hacado/utils";
import React from "react";
import { useConfig, useTextMessaging } from "../context/config";
import { SmsConsentField, smsPolicyRichTags } from "./sms-consent-field";

const digits = (value?: string) => (value ?? "").replace(/\D/g, "");

export type AppointmentSmsConsentKind = "notifications" | "reminders" | "both";

export const appointmentSmsConsentKind = (
  offer?: CustomerAppointmentTextOffer | null,
): AppointmentSmsConsentKind | null => {
  if (!offer) return null;
  const notifications = offer.notifications || offer.other;
  if (!notifications && !offer.reminders) return null;
  if (notifications && offer.reminders) return "both";
  if (offer.reminders) return "reminders";
  return "notifications";
};

export type WaitlistSmsTextFlags = {
  notifications: boolean;
  openSlot: boolean;
  other: boolean;
};

export type WaitlistSmsConsentKind =
  | "notifications"
  | "slot"
  | "slotAndNotifications";

export const waitlistSmsConsentKind = (
  offer?: WaitlistSmsTextFlags | null,
): WaitlistSmsConsentKind | null => {
  if (!offer) return null;

  const notifications = offer.notifications || offer.other;
  if (!notifications && !offer.openSlot) return null;
  if (notifications && offer.openSlot) return "slotAndNotifications";
  if (offer.openSlot) return "slot";

  return "notifications";
};

/** Keeps a checkbox in sync when parent consent arrives after mount, such as after OTP. */
export function useSmsConsentState(propsConsent?: boolean) {
  const consented = propsConsent === true;
  const [smsConsent, setSmsConsent] = React.useState(consented);
  const [appliedConsent, setAppliedConsent] = React.useState(consented);

  if (consented !== appliedConsent) {
    setAppliedConsent(consented);
    if (consented) setSmsConsent(true);
  }

  return [smsConsent, setSmsConsent] as const;
}

/** Writes a parent consent update into a form field that was initialized at mount. */
export function useSyncSmsConsentField(
  setValue: (value: boolean) => void,
  propsConsent: boolean | undefined,
  fieldConsent: boolean | undefined,
) {
  const consented = propsConsent === true;
  const applied = React.useRef(consented);
  const setValueRef = React.useRef(setValue);
  setValueRef.current = setValue;

  React.useEffect(() => {
    if (consented === applied.current) return;

    applied.current = consented;
    if (consented && fieldConsent !== true) {
      setValueRef.current(true);
    }
  }, [consented, fieldConsent]);
}

export const SmsConsentChoice = ({
  id,
  phone,
  checked,
  disabled,
  onCheckedChange,
  lookup,
  label,
  disclosure,
  consentedMessage,
}: {
  id: string;
  phone?: string;
  profilePhone?: string;
  profileConsent?: boolean;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  lookup: (phone: string) => Promise<boolean>;
  label: React.ReactNode;
  disclosure: React.ReactNode;
  consentedMessage: React.ReactNode;
}) => {
  const [hasConsent, setHasConsent] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const onCheckedChangeRef = React.useRef(onCheckedChange);
  const lookupRef = React.useRef(lookup);
  const previousDigits = React.useRef<string | null>(null);
  const resolvedDigits = React.useRef<string | null>(null);
  onCheckedChangeRef.current = onCheckedChange;
  lookupRef.current = lookup;
  const phoneValid = Boolean(normalizeToE164(phone ?? ""));

  React.useEffect(() => {
    const currentDigits = digits(phone);
    const changed =
      previousDigits.current !== null &&
      previousDigits.current !== currentDigits;
    previousDigits.current = currentDigits;

    if (!phoneValid) {
      resolvedDigits.current = null;
      setHasConsent(false);
      setReady(false);
      if (changed) onCheckedChangeRef.current(false);
      return;
    }

    if (!changed && resolvedDigits.current === currentDigits) return;

    if (changed) {
      resolvedDigits.current = null;
      setHasConsent(false);
      onCheckedChangeRef.current(false);
    }

    setReady(false);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      lookupRef
        .current(phone ?? "")
        .then((value) => {
          if (cancelled) return;
          resolvedDigits.current = currentDigits;
          setHasConsent(value);
          setReady(true);
          if (value) onCheckedChangeRef.current(true);
        })
        .catch(() => {
          if (cancelled) return;
          resolvedDigits.current = currentDigits;
          setHasConsent(false);
          setReady(true);
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [phone, phoneValid]);

  if (!phoneValid || !ready) return null;

  if (hasConsent) {
    return <p className="text-sm text-muted-foreground">{consentedMessage}</p>;
  }

  return (
    <SmsConsentField
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      label={label}
      disclosure={disclosure}
    />
  );
};

export const AppointmentSmsConsent = ({
  offer,
  ...props
}: Omit<
  React.ComponentProps<typeof SmsConsentChoice>,
  "label" | "disclosure" | "consentedMessage"
> & {
  offer?: CustomerAppointmentTextOffer | null;
}) => {
  const t = useI18n("translation");
  const { name: businessName } = useConfig();
  const textMessaging = useTextMessaging();
  const kind = appointmentSmsConsentKind(offer);

  if (!textMessaging.enabled || !kind) return null;

  const label = {
    notifications: t("booking.form.smsConsent.label.notifications"),
    reminders: t("booking.form.smsConsent.label.reminders"),
    both: t("booking.form.smsConsent.label.both"),
  }[kind];

  const consentedMessage = {
    notifications: t("booking.form.smsConsent.already.notifications"),
    reminders: t("booking.form.smsConsent.already.reminders"),
    both: t("booking.form.smsConsent.already.both"),
  }[kind];

  return (
    <SmsConsentChoice
      {...props}
      label={label}
      disclosure={t.rich("booking.form.smsConsent.disclosure", {
        ...smsPolicyRichTags(textMessaging),
        businessName,
      })}
      consentedMessage={consentedMessage}
    />
  );
};
