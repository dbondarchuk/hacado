"use client";

import { syncedPaymentsApi } from "@hacado/api-sdk/admin/synced-payments";
import { useI18n } from "@hacado/i18n/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@hacado/ui/alert-dialog";
import { Button } from "@hacado/ui/button";
import { toastPromise } from "@hacado/ui/sonner";
import { Spinner } from "@hacado/ui/spinner";
import { useRouter } from "next/navigation";
import React from "react";

export function QuickLinkApproveMatchedPaymentsButton({
  label,
  icon,
  className,
}: {
  appId?: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) {
  const t = useI18n("admin");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [approving, setApproving] = React.useState(false);

  const approveAll = async () => {
    setApproving(true);
    try {
      await toastPromise(syncedPaymentsApi.confirmAllMatchedSyncedPayments(), {
        success: (data) =>
          t("syncedPayments.toast.approveAllSuccess", {
            count: data.count,
          }),
        error: t("syncedPayments.toast.approveAllError"),
      });

      setOpen(false);
      router.refresh();
    } catch {
      // toastPromise already surfaced the error
    } finally {
      setApproving(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && approving) return;
        setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={className}
          aria-label={label}
        >
          {icon}
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("syncedPayments.approveAllDialog.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("syncedPayments.approveAllDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={approving}>
            {t("syncedPayments.approveAllDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={approveAll} disabled={approving}>
              {approving ? <Spinner /> : null}
              {t("syncedPayments.approveAllDialog.confirm")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
