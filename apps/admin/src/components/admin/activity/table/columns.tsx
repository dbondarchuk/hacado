"use client";

import { useI18n, useLocale } from "@hacado/i18n/client";
import type { ActivityListItem } from "@hacado/types";
import { Badge, Link } from "@hacado/ui";
import {
  ResolvedI18nText,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";
import React from "react";
import { ActivityActorDisplayView } from "../actor-display";

const CreatedAtCell: React.FC<{ value: Date }> = ({ value }) => {
  const locale = useLocale();
  return DateTime.fromJSDate(value instanceof Date ? value : new Date(value))
    .setLocale(locale)
    .toLocaleString(DateTime.DATETIME_MED);
};

const SeverityCell: React.FC<{ severity: ActivityListItem["severity"] }> = ({
  severity,
}) => {
  const t = useI18n("admin");
  const s = severity ?? "info";
  return (
    <Badge variant={severityVariant(s)}>{t(`activity.severity.${s}`)}</Badge>
  );
};

export const columns: ColumnDef<ActivityListItem>[] = [
  {
    accessorKey: "createdAt",
    id: "createdAt",
    header: tableSortHeader(
      "activity.table.columns.createdAt",
      "date",
      "admin",
    ),
    cell: ({ row }) => <CreatedAtCell value={row.original.createdAt} />,
    sortingFn: tableSortNoopFunction,
  },
  {
    accessorKey: "severity",
    id: "severity",
    header: tableSortHeader(
      "activity.table.columns.severity",
      "default",
      "admin",
    ),
    cell: ({ row }) => <SeverityCell severity={row.original.severity} />,
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actor",
    header: tableSortHeader("activity.table.columns.actor", "default", "admin"),
    cell: ({ row }) => (
      <ActivityActorDisplayView actor={row.original.actorDisplay} />
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    accessorKey: "eventType",
    id: "eventType",
    header: tableSortHeader(
      "activity.table.columns.eventType",
      "default",
      "admin",
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.original.eventType}</span>
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "title",
    header: tableSortHeader("activity.table.columns.title", "default", "admin"),
    cell: ({ row }) => <ResolvedI18nText text={row.original.title} />,
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "description",
    header: tableSortHeader(
      "activity.table.columns.description",
      "default",
      "admin",
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        <ResolvedI18nText text={row.original.description} />
      </span>
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "link",
    header: tableSortHeader("activity.table.columns.link", "default", "admin"),
    cell: ({ row }) => {
      const href = row.original.link;
      const t = useI18n("admin");
      if (!href) return null;
      return (
        <Link href={href} variant="underline">
          {t("activity.table.columns.link")}
        </Link>
      );
    },
    sortingFn: tableSortNoopFunction,
  },
];

function severityVariant(
  s: NonNullable<ActivityListItem["severity"]>,
): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "error":
      return "destructive";
    case "warning":
      return "secondary";
    case "success":
      return "outline";
    default:
      return "default";
  }
}
