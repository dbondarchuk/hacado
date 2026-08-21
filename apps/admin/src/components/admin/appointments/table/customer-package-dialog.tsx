"use client";

import { useI18n, useLocale } from "@hacado/i18n/client";
import {
  Appointment,
  CustomerPackageListModel,
  isAppointmentCoveredByPackage,
} from "@hacado/types";
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Link,
  useTimeZone,
} from "@hacado/ui";
import { CustomerPackageActions } from "@hacado/ui-admin-kit";
import { DateTime } from "luxon";
import React from "react";

export const CustomerPackageDialog: React.FC<{
  appointment: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ appointment, open, onOpenChange }) => {
  const t = useI18n("admin");
  const timeZone = useTimeZone();
  const locale = useLocale();
  const customerPackage = appointment.customerPackage;
  const usage = appointment.packageUsage;
  const name = customerPackage?.name ?? usage?.name;
  if (!name) return null;

  const usedCredits = customerPackage
    ? customerPackage.totalCredits - customerPackage.remainingCredits
    : undefined;

  const listModel: CustomerPackageListModel | null = customerPackage
    ? {
        ...customerPackage,
        usedCredits: usedCredits ?? 0,
      }
    : null;

  const expiresLabel = customerPackage?.expiresAt
    ? t("services.packages.customer.expires", {
        date: DateTime.fromJSDate(customerPackage.expiresAt)
          .setZone(timeZone)
          .toLocaleString(DateTime.DATE_MED, { locale }),
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 truncate">{name}</span>
            {customerPackage ? (
              <Badge variant="outline">
                {t(
                  `services.packages.sold.statusBadges.${customerPackage.status}`,
                )}
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {t("services.packages.appointment.label")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 text-sm">
          {customerPackage ? (
            <>
              <div className="text-muted-foreground">
                {t("services.packages.customer.remaining", {
                  remaining: customerPackage.remainingCredits,
                  total: customerPackage.totalCredits,
                })}
              </div>
              <div className="text-muted-foreground">
                {t("services.packages.customer.used", {
                  used: usedCredits ?? 0,
                  total: customerPackage.totalCredits,
                })}
              </div>
              {expiresLabel ? (
                <div className="text-muted-foreground">{expiresLabel}</div>
              ) : null}
              {customerPackage.purchasedAt ? (
                <div className="text-muted-foreground">
                  {t("appointments.table.packageDialog.purchasedAt", {
                    date: DateTime.fromJSDate(customerPackage.purchasedAt)
                      .setZone(timeZone)
                      .toLocaleString(DateTime.DATETIME_MED, { locale }),
                  })}
                </div>
              ) : null}
            </>
          ) : null}

          {usage ? (
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              {isAppointmentCoveredByPackage(appointment)
                ? t("services.packages.appointment.creditsUsed", {
                    credits: usage.credits,
                  })
                : t("appointments.table.packageDialog.creditsRestored", {
                    credits: usage.credits,
                  })}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-1">
            {usage ? (
              <Link
                href={`/dashboard/customers/${appointment.customerId}/packages#package-${usage.customerPackageId}`}
                variant="underline"
              >
                {t("services.packages.appointment.view")}
              </Link>
            ) : null}
            {customerPackage ? (
              <Link
                href={`/dashboard/services/packages/${customerPackage.packageId}`}
                variant="underline"
              >
                {t("appointments.table.packageDialog.viewCatalog")}
              </Link>
            ) : null}
          </div>

          {listModel ? (
            <div className="pt-1">
              <CustomerPackageActions pkg={listModel} />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              {t("common.buttons.close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
