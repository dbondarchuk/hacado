"use client";
import { useI18n } from "@hacado/i18n/client";
import { PageFooterListModel } from "@hacado/types/pages";
import {
  TableDateTime,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin/data-table";
import { Checkbox } from "@hacado/ui/checkbox";
import { Link } from "@hacado/ui/link";
import { ColumnDef } from "@tanstack/react-table";
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
          size="sm"
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
    cell: ({ row }) => <TableDateTime value={row.original.updatedAt} />,
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
