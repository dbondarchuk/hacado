"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useI18n } from "@timelish/i18n/client";
import { Checkbox, Link } from "@timelish/ui";
import { tableSortHeader, tableSortNoopFunction } from "@timelish/ui-admin";
import { Lock } from "lucide-react";
import { DateTime } from "luxon";
import { FormListModel } from "../../models";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { CellAction } from "./cell-action";

export type FormsTableRow = FormListModel & { appId: string };

export const columns: ColumnDef<FormsTableRow>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const t = useI18n("ui");
      return (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("common.selectAll")}
        />
      );
    },
    cell: ({ row }) => {
      const t = useI18n("ui");
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
        href={`/dashboard/forms/edit?id=${row.original._id}`}
        variant="underline"
        className={
          row.original.isArchived
            ? "flex items-center gap-1.5 text-muted-foreground"
            : ""
        }
      >
        {row.original.isArchived ? (
          <>
            <Lock className="size-3.5" />
            {row.original.name}
          </>
        ) : (
          row.original.name
        )}
      </Link>
    ),
    id: "name",
    header: tableSortHeader<FormsAdminNamespace, FormsAdminKeys>(
      "forms.table.columns.name",
      "string",
      formsAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/forms/responses?formId=${row.original._id}`}
        variant="underline"
      >
        {row.original.responsesCount || 0}
      </Link>
    ),
    id: "responsesCount",
    header: tableSortHeader<FormsAdminNamespace, FormsAdminKeys>(
      "forms.table.columns.responsesCount",
      "number",
      formsAdminNamespace,
    ),
    enableSorting: false,
  },
  {
    cell: ({ row }) => {
      const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(
        formsAdminNamespace,
      );
      return (
        <Link
          href={`/dashboard/forms/responses?formId=${row.original._id}`}
          variant="underline"
        >
          {row.original.lastResponse
            ? DateTime.fromJSDate(row.original.lastResponse).toLocaleString(
                DateTime.DATETIME_MED,
              )
            : t("forms.table.columns.noResponses")}
        </Link>
      );
    },
    id: "lastResponse",
    header: tableSortHeader<FormsAdminNamespace, FormsAdminKeys>(
      "forms.table.columns.lastResponse",
      "date",
      formsAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      return DateTime.fromJSDate(row.original.createdAt).toLocaleString(
        DateTime.DATETIME_MED,
      );
    },
    id: "createdAt",
    header: tableSortHeader<FormsAdminNamespace, FormsAdminKeys>(
      "forms.table.columns.createdAt",
      "date",
      formsAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <CellAction form={row.original} appId={row.original.appId} />
    ),
  },
];
