"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useI18n, useLocale } from "@timelish/i18n/client";
import { PageFooterListModel } from "@timelish/types";
import { Checkbox, Link } from "@timelish/ui";
import { tableSortHeader, tableSortNoopFunction } from "@timelish/ui-admin";
import { DateTime } from "luxon";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<PageFooterListModel>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const t = useI18n("admin");
      return (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("pages.footers.table.actions.selectAll")}
        />
      );
    },
    cell: ({ row }) => {
      const t = useI18n("admin");
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          disabled={row.original.usedCount > 0}
          aria-label={t("pages.footers.table.actions.selectRow")}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    cell: ({ row }) => {
      return (
        <Link
          href={`/dashboard/pages/footers/${row.original._id}`}
          variant="underline"
        >
          {row.original.name}
        </Link>
      );
    },
    id: "name",
    header: tableSortHeader(
      "pages.footers.table.columns.name",
      "string",
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
      "pages.footers.table.columns.updatedAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      return row.original.usedCount || 0;
    },
    id: "usedCount",
    header: tableSortHeader(
      "pages.footers.table.columns.usedCount",
      "number",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction pageFooter={row.original} />,
  },
];
