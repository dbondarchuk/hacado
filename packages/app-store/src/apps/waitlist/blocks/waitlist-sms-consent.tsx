"use client";

import { appsApi } from "@hacado/api-sdk/client/apps";
import { useI18n } from "@hacado/i18n/client";
import { useConfig, useTextMessaging } from "@hacado/ui/context";
import {
  SmsConsentChoice,
  waitlistSmsConsentKind,
} from "@hacado/ui/sms-consent-choice";
import { smsPolicyRichTags } from "@hacado/ui/sms-consent-field";
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
    appsApi
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
  const textMessaging = useTextMessaging();
  if (!textMessaging.enabled || !kind) return null;

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
        ...smsPolicyRichTags(textMessaging),
        businessName,
      })}
      consentedMessage={t("block.smsConsent.already")}
    />
  );
};
