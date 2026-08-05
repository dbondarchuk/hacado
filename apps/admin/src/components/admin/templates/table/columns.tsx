"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { TemplateListModel } from "@hacado/types";
import { Checkbox, Link } from "@hacado/ui";
import { tableSortHeader, tableSortNoopFunction } from "@hacado/ui-admin";
import { DateTime } from "luxon";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<TemplateListModel>[] = [
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
        variant="underline"
        href={`/dashboard/templates/${row.original._id}`}
      >
        {row.original.name}
      </Link>
    ),
    id: "name",
    header: tableSortHeader("templates.table.columns.name", "string", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      return t(`common.labels.channel.${row.original.type}`);
    },
    id: "type",
    header: tableSortHeader("templates.table.columns.type", "string", "admin"),
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
      "templates.table.columns.updatedAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction template={row.original} />,
  },
];
