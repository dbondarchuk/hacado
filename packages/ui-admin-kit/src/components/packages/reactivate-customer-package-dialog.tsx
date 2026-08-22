"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { CustomerPackageListModel } from "@hacado/types";
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
  Button,
  Spinner,
  toastPromise,
} from "@hacado/ui";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type ReactivateCustomerPackageDialogProps = {
  pkg: CustomerPackageListModel;
  children?: React.ReactNode;
};

export const ReactivateCustomerPackageDialog: React.FC<
  ReactivateCustomerPackageDialogProps
> = ({ pkg, children }) => {
  const t = useI18n("admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (pkg.status !== "cancelled") {
    return null;
  }

  const onReactivatePackage = async () => {
    setLoading(true);
    try {
      await toastPromise(
        adminApi.packages.adjustCustomerPackage(pkg._id, {
          reactivate: true,
        }),
        {
          success: t("services.packages.customer.reactivate.success"),
          error: t("services.packages.form.toasts.requestError"),
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
          <Button type="button" size="sm" variant="outline">
            {t("services.packages.customer.reactivate.button")}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("services.packages.customer.reactivate.confirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("services.packages.customer.reactivate.confirmDescription", {
              name: pkg.name,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {t("common.buttons.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              disabled={loading}
              onClick={onReactivatePackage}
            >
              {loading ? <Spinner className="size-4" /> : null}
              {t("services.packages.customer.reactivate.button")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
