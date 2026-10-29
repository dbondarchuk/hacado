"use client";
import { useI18n } from "@hacado/i18n/client";
import { AppointmentPackageListModel } from "@hacado/types";
import {
  Badge,
  Checkbox,
  Link,
  useCurrencyFormat,
  useTimeZone,
} from "@hacado/ui";
import { tableSortHeader, tableSortNoopFunction } from "@hacado/ui-admin";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<AppointmentPackageListModel>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const t = useI18n("admin");
      return (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("common.selectAll")}
        />
      );
    },
    cell: ({ row }) => {
      const t = useI18n("admin");
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("common.selectRow")}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/catalog/packages/${row.original._id}`}
        variant="underline"
      >
        {row.original.name}
      </Link>
    ),
    id: "name",
    header: tableSortHeader(
      "catalog.packages.table.columns.name",
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
      "catalog.packages.table.columns.price",
      "number",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) =>
      row.original.items.reduce((sum, item) => sum + item.credits, 0),
    id: "credits",
    header: tableSortHeader(
      "catalog.packages.table.columns.credits",
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
          {t(`catalog.packages.table.statusBadges.${row.original.status}`)}
        </Badge>
      );
    },
    id: "status",
    header: tableSortHeader(
      "catalog.packages.table.columns.status",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/catalog/packages/sold?packageId=${row.original._id}`}
        variant="underline"
      >
        {row.original.soldCount}
      </Link>
    ),
    id: "soldCount",
    header: tableSortHeader(
      "catalog.packages.table.columns.soldCount",
      "number",
      "admin",
    ),
    enableSorting: false,
  },
  {
    cell: ({ row }) => {
      const timeZone = useTimeZone();
      return DateTime.fromJSDate(new Date(row.original.updatedAt))
        .setZone(timeZone)
        .toLocaleString(DateTime.DATETIME_MED);
    },
    id: "updatedAt",
    header: tableSortHeader(
      "catalog.packages.table.columns.updatedAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction pkg={row.original} />,
  },
];
