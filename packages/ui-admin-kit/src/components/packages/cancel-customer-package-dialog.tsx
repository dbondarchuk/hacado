"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { CustomerPackageListModel } from "@hacado/types/booking";
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
import React, { useState } from "react";

type CancelCustomerPackageDialogProps = {
  pkg: CustomerPackageListModel;
  children?: React.ReactNode;
};

export const CancelCustomerPackageDialog: React.FC<
  CancelCustomerPackageDialogProps
> = ({ pkg, children }) => {
  const t = useI18n("admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (pkg.status === "cancelled") {
    return null;
  }

  const onCancelPackage = async () => {
    setLoading(true);
    try {
      await toastPromise(
        adminApi.packages.adjustCustomerPackage(pkg._id, { cancel: true }),
        {
          success: t("catalog.packages.customer.cancel.success"),
          error: t("catalog.packages.form.toasts.requestError"),
        },
      );
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children ?? (
          <Button type="button" size="sm" variant="destructive">
            {t("catalog.packages.customer.cancel.button")}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("catalog.packages.customer.cancel.confirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("catalog.packages.customer.cancel.confirmDescription", {
              name: pkg.name,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {t("common.buttons.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction asChild variant="destructive">
            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={onCancelPackage}
            >
              {loading ? <Spinner className="size-4" /> : null}
              {t("catalog.packages.customer.cancel.button")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
