"use client";

import { adminApi, AdminApiError } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Link,
  Spinner,
  toast,
} from "@timelish/ui";
import React from "react";

export function isSubscriptionPastDueError(error: unknown): boolean {
  return error instanceof AdminApiError && error.status === 402;
}

export const SubscriptionPastDueDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const t = useI18n("admin");
  const [openingPortal, setOpeningPortal] = React.useState(false);

  const openBillingPortal = async () => {
    setOpeningPortal(true);
    try {
      const url = await adminApi.billing.getBillingPortalUrl();
      window.location.assign(url);
    } catch {
      toast.error(t("settings.general.billing.portalError"));
    } finally {
      setOpeningPortal(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("appointments.subscriptionPastDue.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("appointments.subscriptionPastDue.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row flex-wrap gap-2 sm:justify-between">
          <AlertDialogCancel disabled={openingPortal}>
            {t("common.buttons.close")}
          </AlertDialogCancel>
          <div className="flex flex-row flex-wrap gap-2">
            <Link
              href="/dashboard/settings/brand?activeTab=general"
              button
              variant="secondary"
            >
              {t("appointments.subscriptionPastDue.openSettings")}
            </Link>
            <Button
              type="button"
              variant="default"
              className="inline-flex items-center gap-2"
              disabled={openingPortal}
              onClick={() => void openBillingPortal()}
            >
              {openingPortal ? <Spinner className="size-4" /> : null}
              {openingPortal
                ? t("appointments.subscriptionPastDue.openingPortal")
                : t("settings.general.billing.openPortal")}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
