"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { Discount } from "@hacado/types";
import { Checkbox, Link, useCurrencyFormat } from "@hacado/ui";
import { tableSortHeader, tableSortNoopFunction } from "@hacado/ui-admin";
import { DateTime } from "luxon";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<
  Discount & {
    usedCount: number;
  }
>[] = [
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
        href={`/dashboard/services/discounts/${row.original._id}`}
        variant="underline"
      >
        {row.original.name}
      </Link>
    ),
    id: "name",
    header: tableSortHeader(
      "services.discounts.table.columns.name",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    accessorFn: (discount) => discount.codes?.join(", "),
    id: "codes",
    header: () => {
      const t = useI18n("admin");
      return t("services.discounts.table.columns.codes");
    },
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      return t(`common.labels.discountType.${row.original.type}`);
    },
    id: "type",
    header: tableSortHeader(
      "services.discounts.table.columns.type",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const currencyFormat = useCurrencyFormat();
      const discount = row.original;
      return discount.type === "amount"
        ? currencyFormat(discount.value)
        : `${discount.value}%`;
    },
    id: "value",
    header: tableSortHeader(
      "services.discounts.table.columns.value",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    accessorFn: (discount) => (discount.enabled ? "Active" : "Disabled"),
    id: "enabled",
    header: tableSortHeader(
      "services.discounts.table.columns.enabled",
      "default",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return row.original.startDate
        ? DateTime.fromJSDate(row.original.startDate).toLocaleString(
            DateTime.DATETIME_MED,
            { locale },
          )
        : "";
    },
    id: "startDate",
    header: tableSortHeader(
      "services.discounts.table.columns.startDate",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return row.original.endDate
        ? DateTime.fromJSDate(row.original.endDate).toLocaleString(
            DateTime.DATETIME_MED,
            { locale },
          )
        : "";
    },
    id: "endDate",
    header: tableSortHeader(
      "services.discounts.table.columns.endDate",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/appointments?discount=${row.original._id}`}
        variant="underline"
      >
        {row.original.usedCount || 0}
      </Link>
    ),
    id: "usedCount",
    header: tableSortHeader(
      "services.discounts.table.columns.usedCount",
      "number",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return DateTime.fromJSDate(row.original.updatedAt).toLocaleString(
        DateTime.DATETIME_MED,
        { locale },
      );
    },
    id: "updatedAt",
    header: tableSortHeader(
      "services.discounts.table.columns.updatedAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction discount={row.original} />,
  },
];
