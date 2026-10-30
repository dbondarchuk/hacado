"use client";

import { customersApi } from "@hacado/api-sdk/admin/customers";
import { useI18n } from "@hacado/i18n/client";
import { CustomerSmsConsentStatus } from "@hacado/types/customers";
import { Button } from "@hacado/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@hacado/ui/card";
import { toastPromise } from "@hacado/ui/sonner";
import { useState } from "react";

export const CustomerSmsConsent = ({
  customerId,
  hasPhone,
  canUpdate,
  isDeleted,
  status: initialStatus,
}: {
  customerId: string;
  hasPhone: boolean;
  canUpdate: boolean;
  isDeleted?: boolean;
  status: CustomerSmsConsentStatus;
}) => {
  const t = useI18n("admin");
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const update = async (consented: boolean) => {
    setLoading(true);
    try {
      const next = await toastPromise(
        customersApi.setCustomerSmsConsent(customerId, consented),
        {
          success: consented
            ? t("customers.smsConsent.attested")
            : t("customers.smsConsent.revoked"),
          error: t("customers.smsConsent.error"),
        },
      );

      setStatus(next);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("customers.smsConsent.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-stretch gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        {!hasPhone ? (
          <p className="text-sm text-muted-foreground">
            {t("customers.smsConsent.noPhone")}
          </p>
        ) : (
          <>
            <p className="min-w-0 text-sm text-muted-foreground">
              {status.optedOut
                ? t("smsConsent.optedOut")
                : status.consented
                  ? t("smsConsent.already")
                  : t("customers.smsConsent.inactive")}
            </p>
            {canUpdate && !isDeleted ? (
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                title={
                  status.consented
                    ? t("customers.smsConsent.revoke")
                    : t("smsConsent.attest")
                }
                className="w-full min-w-0 justify-start overflow-hidden sm:w-auto sm:max-w-lg sm:shrink-0"
                onClick={() => update(!status.consented)}
              >
                <span className="truncate">
                  {status.consented
                    ? t("customers.smsConsent.revoke")
                    : t("smsConsent.attest")}
                </span>
              </Button>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
};
