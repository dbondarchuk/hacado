"use client";

import { serializeAppointmentsSearchParams } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { appointmentStatuses, CustomerPackageListModel } from "@hacado/types";
import { Badge, Link, useCurrencyFormat } from "@hacado/ui";
import {
  CustomerName,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin";
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
        href={`/dashboard/services/packages/${row.original.packageId}`}
        variant="underline"
      >
        {row.original.name}
      </Link>
    ),
    id: "name",
    header: tableSortHeader(
      "services.packages.sold.table.columns.name",
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
      "services.packages.sold.table.columns.customer",
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
      "services.packages.sold.table.columns.price",
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
      "services.packages.sold.table.columns.used",
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
      "services.packages.sold.table.columns.remaining",
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
          {t(`services.packages.sold.statusBadges.${row.original.status}`)}
        </Badge>
      );
    },
    id: "status",
    header: tableSortHeader(
      "services.packages.sold.table.columns.status",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) =>
      DateTime.fromJSDate(new Date(row.original.purchasedAt)).toLocaleString(
        DateTime.DATETIME_MED,
      ),
    id: "purchasedAt",
    header: tableSortHeader(
      "services.packages.sold.table.columns.purchasedAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) =>
      row.original.expiresAt
        ? DateTime.fromJSDate(new Date(row.original.expiresAt)).toLocaleString(
            DateTime.DATE_MED,
          )
        : "—",
    id: "expiresAt",
    header: tableSortHeader(
      "services.packages.sold.table.columns.expiresAt",
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
