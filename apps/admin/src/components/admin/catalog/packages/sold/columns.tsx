"use client";

import { serializeAppointmentsSearchParams } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  appointmentStatuses,
  CustomerPackageListModel,
} from "@hacado/types/booking";
import {
  CustomerName,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin/data-table";
import { Badge } from "@hacado/ui/badge";
import { useCurrencyFormat, useTimeZone } from "@hacado/ui/context";
import { Link } from "@hacado/ui/link";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";
import { SoldPackageCellAction } from "./cell-action";

const soldPackageAppointmentsHref = (customerPackageId: string) =>
  `/dashboard/appointments${serializeAppointmentsSearchParams({
    customerPackageId,
    status: [...appointmentStatuses],
  })}`;

export const soldPackageColumns: ColumnDef<CustomerPackageListModel>[] = [
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/catalog/packages/${row.original.packageId}`}
        variant="underline"
      >
        {row.original.name}
      </Link>
    ),
    id: "name",
    header: tableSortHeader(
      "catalog.packages.sold.table.columns.name",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) =>
      row.original.customer ? (
        <Link
          href={`/dashboard/customers/${row.original.customerId}/packages`}
          variant="underline"
        >
          <CustomerName customer={row.original.customer} />
        </Link>
      ) : (
        row.original.customerId
      ),
    id: "customer",
    header: tableSortHeader(
      "catalog.packages.sold.table.columns.customer",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const currencyFormat = useCurrencyFormat();
      return currencyFormat(row.original.price);
    },
    id: "price",
    header: tableSortHeader(
      "catalog.packages.sold.table.columns.price",
      "number",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <Link
        href={soldPackageAppointmentsHref(row.original._id)}
        variant="underline"
      >
        {row.original.usedCredits} / {row.original.totalCredits}
      </Link>
    ),
    id: "usedCredits",
    header: tableSortHeader(
      "catalog.packages.sold.table.columns.used",
      "number",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) =>
      `${row.original.remainingCredits} / ${row.original.totalCredits}`,
    id: "remainingCredits",
    header: tableSortHeader(
      "catalog.packages.sold.table.columns.remaining",
      "number",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      return (
        <Badge
          variant={row.original.status === "active" ? "default" : "secondary"}
        >
          {t(`catalog.packages.sold.statusBadges.${row.original.status}`)}
        </Badge>
      );
    },
    id: "status",
    header: tableSortHeader(
      "catalog.packages.sold.table.columns.status",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const timeZone = useTimeZone();
      return DateTime.fromJSDate(new Date(row.original.purchasedAt))
        .setZone(timeZone)
        .toLocaleString(DateTime.DATETIME_MED);
    },
    id: "purchasedAt",
    header: tableSortHeader(
      "catalog.packages.sold.table.columns.purchasedAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const timeZone = useTimeZone();
      return row.original.expiresAt
        ? DateTime.fromJSDate(new Date(row.original.expiresAt))
            .setZone(timeZone)
            .toLocaleString(DateTime.DATE_MED)
        : "-";
    },
    id: "expiresAt",
    header: tableSortHeader(
      "catalog.packages.sold.table.columns.expiresAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => <SoldPackageCellAction pkg={row.original} />,
  },
];
