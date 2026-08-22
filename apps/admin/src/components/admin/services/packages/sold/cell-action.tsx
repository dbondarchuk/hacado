"use client";

import { newAppointmentHrefForCustomerPackage } from "@/components/admin/services/packages/new-appointment-href";
import { serializeAppointmentsSearchParams } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { appointmentStatuses, CustomerPackageListModel } from "@hacado/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hacado/ui";
import {
  AdjustPackageCreditsDialog,
  canAdjustCustomerPackageCredits,
  CancelCustomerPackageDialog,
  ReactivateCustomerPackageDialog,
} from "@hacado/ui-admin-kit";
import {
  CalendarDays,
  CalendarPlus,
  MoreHorizontal,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export const SoldPackageCellAction: React.FC<{
  pkg: CustomerPackageListModel;
}> = ({ pkg }) => {
  const t = useI18n("admin");
  const isCancelled = pkg.status === "cancelled";
  const canAdjust = canAdjustCustomerPackageCredits(pkg);
  const newAppointmentHref = newAppointmentHrefForCustomerPackage(pkg);
  const appointmentsHref = `/dashboard/appointments${serializeAppointmentsSearchParams(
    {
      customerPackageId: pkg._id,
      status: [...appointmentStatuses],
    },
  )}`;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">
            {t("services.packages.table.cellAction.actions")}
          </span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {t("services.packages.table.cellAction.actions")}
        </DropdownMenuLabel>
        {newAppointmentHref ? (
          <DropdownMenuItem asChild>
            <Link href={newAppointmentHref}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              {t("services.packages.sold.table.cellAction.scheduleAppointment")}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href={appointmentsHref}>
            <CalendarDays className="mr-2 h-4 w-4" />
            {t("services.packages.sold.table.cellAction.viewAppointments")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/customers/${pkg.customerId}/packages`}>
            <UserRound className="mr-2 h-4 w-4" />
            {t("services.packages.sold.table.cellAction.viewCustomer")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {canAdjust ? (
          <AdjustPackageCreditsDialog pkg={pkg}>
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              {t("services.packages.adjust.title")}
            </DropdownMenuItem>
          </AdjustPackageCreditsDialog>
        ) : null}
        {isCancelled ? (
          <ReactivateCustomerPackageDialog pkg={pkg}>
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              {t("services.packages.customer.reactivate.button")}
            </DropdownMenuItem>
          </ReactivateCustomerPackageDialog>
        ) : (
          <CancelCustomerPackageDialog pkg={pkg}>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(event) => event.preventDefault()}
            >
              {t("services.packages.customer.cancel.button")}
            </DropdownMenuItem>
          </CancelCustomerPackageDialog>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
