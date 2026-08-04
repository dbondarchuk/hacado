"use client";

import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { Button, Spinner, toast } from "@timelish/ui";
import { useState } from "react";

export function SubscriptionInactiveBillingPortalButton() {
  const t = useI18n("admin");
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const url = await adminApi.billing.getBillingPortalUrl();
      window.location.assign(url);
    } catch {
      toast.error(t("settings.general.billing.portalError"));
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={() => void openPortal()}
      disabled={loading}
      className="inline-flex items-center gap-2"
    >
      {loading ? <Spinner className="size-4" /> : null}
      {loading
        ? t("appointments.subscriptionPastDue.openingPortal")
        : t("settings.general.billing.openPortal")}
    </Button>
  );
}
