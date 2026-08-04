"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useI18n, useLocale } from "@timelish/i18n/client";
import { Page } from "@timelish/types";
import { Checkbox, Link } from "@timelish/ui";
import { tableSortHeader, tableSortNoopFunction } from "@timelish/ui-admin";
import { DateTime } from "luxon";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<Page>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const t = useI18n("admin");
      return (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("pages.table.actions.selectAll")}
        />
      );
    },
    cell: ({ row }) => {
      const t = useI18n("admin");
      return (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={row.original.slug === "home"}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("pages.table.actions.selectRow")}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    cell: ({ row }) => {
      return (
        <Link href={`/dashboard/pages/${row.original._id}`} variant="underline">
          {row.original.title}
        </Link>
      );
    },
    id: "title",
    header: tableSortHeader("pages.table.columns.title", "string", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    accessorFn: (page) => page.slug,
    id: "slug",
    header: tableSortHeader("pages.table.columns.slug", "string", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      return row.original.published
        ? t("pages.table.filters.published")
        : t("pages.table.filters.draft");
    },
    id: "published",
    header: tableSortHeader(
      "pages.table.columns.published",
      "default",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return DateTime.fromJSDate(row.original.publishDate).toLocaleString(
        DateTime.DATETIME_MED,
        { locale },
      );
    },
    id: "publishDate",
    header: tableSortHeader("pages.table.columns.publishDate", "date", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return DateTime.fromJSDate(row.original.createdAt).toLocaleString(
        DateTime.DATETIME_MED,
        { locale },
      );
    },
    id: "createdAt",
    header: tableSortHeader("pages.table.columns.createdAt", "date", "admin"),
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
    header: tableSortHeader("pages.table.columns.updatedAt", "date", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    header: ({ column }) => {
      const t = useI18n("admin");
      return t("pages.table.columns.tags");
    },
    id: "tags",
    sortingFn: tableSortNoopFunction,
    cell: ({ row }) => {
      return row.original.tags?.join(", ") || "";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction page={row.original} />,
  },
];
