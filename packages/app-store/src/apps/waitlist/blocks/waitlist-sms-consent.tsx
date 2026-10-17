"use client";

import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  SmsConsentChoice,
  smsPolicyRichTags,
  useConfig,
  waitlistSmsConsentKind,
} from "@hacado/ui";
import React, { useEffect, useState } from "react";
import { CustomerWaitlistTextOffer } from "../customer-waitlist-text";
import {
  WaitlistPublicKeys,
  WaitlistPublicNamespace,
  waitlistPublicNamespace,
} from "../translations/types";

export function useWaitlistSmsText(appId?: string) {
  const [offer, setOffer] = useState<CustomerWaitlistTextOffer | null>(null);

  useEffect(() => {
    if (!appId) {
      setOffer(null);
      return;
    }

    let cancelled = false;
    clientApi.apps
      .callAppApi<CustomerWaitlistTextOffer>({
        appId,
        path: "sms-text",
        method: "GET",
      })
      .then((value) => {
        if (!cancelled) setOffer(value);
      })
      .catch(() => {
        if (!cancelled) setOffer(null);
      });

    return () => {
      cancelled = true;
    };
  }, [appId]);

  return offer;
}

export const WaitlistSmsConsent = ({
  offer,
  ...props
}: Omit<
  React.ComponentProps<typeof SmsConsentChoice>,
  "label" | "disclosure" | "consentedMessage"
> & {
  offer?: CustomerWaitlistTextOffer | null;
}) => {
  const kind = waitlistSmsConsentKind(offer);
  const t = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );
  const { name: businessName } = useConfig();
  if (!kind) return null;

  const label = {
    notifications: t("block.smsConsent.label.notifications"),
    slot: t("block.smsConsent.label.slot"),
    slotAndNotifications: t("block.smsConsent.label.slotAndNotifications"),
  }[kind];

  return (
    <SmsConsentChoice
      {...props}
      label={label}
      disclosure={t.rich("block.smsConsent.disclosure", {
        ...smsPolicyRichTags,
        businessName,
      })}
      consentedMessage={t("block.smsConsent.already")}
    />
  );
};
