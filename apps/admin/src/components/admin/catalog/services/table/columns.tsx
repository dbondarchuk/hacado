"use client";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { AppointmentOption } from "@hacado/types/booking";
import { useAuth } from "@hacado/ui-admin/context";
import {
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin/data-table";
import { Checkbox } from "@hacado/ui/checkbox";
import { useTimeZone } from "@hacado/ui/context";
import { Link } from "@hacado/ui/link";
import { hasPermission } from "@hacado/utils";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<AppointmentOption>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const t = useI18n("admin");
      const { user } = useAuth();
      if (!hasPermission(user, "service", "delete")) return null;
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
      const { user } = useAuth();
      if (!hasPermission(user, "service", "delete")) return null;
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
    cell: ({ row }) => {
      const { user } = useAuth();
      const canUpdate = hasPermission(user, "service", "update");
      if (!canUpdate) return row.original.name;
      return (
        <Link
          href={`/dashboard/catalog/services/${row.original._id}`}
          variant="underline"
        >
          {row.original.name}
        </Link>
      );
    },
    id: "name",
    header: tableSortHeader(
      "catalog.services.table.columns.name",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      const timeZone = useTimeZone();
      return DateTime.fromJSDate(row.original.updatedAt)
        .setZone(timeZone)
        .toLocaleString(DateTime.DATETIME_MED, { locale });
    },
    id: "updatedAt",
    header: tableSortHeader(
      "catalog.services.table.columns.updatedAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction option={row.original} />,
  },
];
