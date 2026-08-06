"use client";

import { useI18n, useLocale } from "@hacado/i18n/client";
import { Badge } from "@hacado/ui";
import { tableSortHeader, tableSortNoopFunction } from "@hacado/ui-admin";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";
import { CellAction } from "./cell-action";
import type { TeamMemberListModel } from "./types";

export const TeamMembersTableColumnLength = 6;

export const columns: ColumnDef<TeamMemberListModel>[] = [
  {
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <img
          alt={row.original.name}
          src={row.original.image ?? "/unknown-person.png"}
          width={36}
          height={36}
          className="size-9 rounded-full object-cover"
        />
        <span className="font-medium">{row.original.name || "—"}</span>
      </div>
    ),
    id: "name",
    header: tableSortHeader("team.table.columns.name", "string", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => row.original.email || "—",
    id: "email",
    header: tableSortHeader("team.table.columns.email", "string", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      const role = row.original.role;
      const key =
        role === "owner"
          ? "roles.owner"
          : role === "admin"
            ? "roles.admin"
            : role === "coordinator"
              ? "roles.coordinator"
              : "roles.staff";
      return t(key);
    },
    id: "role",
    header: tableSortHeader("team.table.columns.role", "string", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      if (row.original.status === "inactive") {
        const reason = row.original.inactiveReason;
        return (
          <Badge variant="secondary">
            {reason === "downgrade"
              ? t("team.inactiveReason.downgrade")
              : reason === "removed"
                ? t("team.inactiveReason.removed")
                : t("team.inactive")}
          </Badge>
        );
      }
      return <Badge>{t("team.table.status.active")}</Badge>;
    },
    id: "status",
    header: tableSortHeader("team.table.columns.status", "string", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return DateTime.fromJSDate(
        new Date(row.original.createdAt),
      ).toLocaleString(DateTime.DATETIME_MED, { locale });
    },
    id: "createdAt",
    header: tableSortHeader("team.table.columns.joinedAt", "date", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction member={row.original} />,
  },
];
