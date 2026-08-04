"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useI18n, useLocale } from "@timelish/i18n/client";
import { Checkbox, Link } from "@timelish/ui";
import { tableSortHeader, tableSortNoopFunction } from "@timelish/ui-admin";
import { DateTime } from "luxon";
import { BlogPost } from "../models";
import {
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "../translations/types";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<BlogPost & { appId: string }>[] = [
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
        href={`/dashboard/blog/edit?id=${row.original._id}`}
        variant="underline"
      >
        {row.original.title}
      </Link>
    ),
    id: "title",
    header: tableSortHeader<BlogAdminNamespace, BlogAdminKeys>(
      "table.columns.title",
      "string",
      blogAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => row.original.slug,
    id: "slug",
    header: tableSortHeader<BlogAdminNamespace, BlogAdminKeys>(
      "table.columns.slug",
      "string",
      blogAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
      return row.original.isPublished
        ? t("table.columns.published")
        : t("table.columns.draft");
    },
    id: "isPublished",
    header: tableSortHeader<BlogAdminNamespace, BlogAdminKeys>(
      "table.columns.status",
      "string",
      blogAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return DateTime.fromJSDate(row.original.publicationDate).toLocaleString(
        DateTime.DATETIME_MED,
        { locale },
      );
    },
    id: "publicationDate",
    header: tableSortHeader<BlogAdminNamespace, BlogAdminKeys>(
      "table.columns.publicationDate",
      "date",
      blogAdminNamespace,
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const count = row.original.totalCommentsCount ?? 0;
      return (
        <Link
          href={`/dashboard/blog/comments?postId=${row.original._id}`}
          variant="underline"
        >
          {count}
        </Link>
      );
    },
    id: "comments",
    header: tableSortHeader<BlogAdminNamespace, BlogAdminKeys>(
      "table.columns.comments",
      "number",
      blogAdminNamespace,
    ),
    enableSorting: false,
  },
  {
    cell: ({ row }) => {
      if (!row.original.tags || row.original.tags.length === 0) {
        return null;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {row.original.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs bg-secondary rounded-md"
            >
              {tag}
            </span>
          ))}
          {row.original.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-muted-foreground">
              +{row.original.tags.length - 3}
            </span>
          )}
        </div>
      );
    },
    id: "tags",
    header: () => {
      const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
      return t("table.columns.tags");
    },
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <CellAction blogPost={row.original} appId={row.original.appId} />
    ),
  },
];
