"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useI18n } from "@timelish/i18n/client";
import { Checkbox, Link } from "@timelish/ui";
import { tableSortHeader, tableSortNoopFunction } from "@timelish/ui-admin";
import { DateTime } from "luxon";
import { DesignListModel } from "../../models";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { CellAction } from "./cell-action";

export type DesignsTableRow = DesignListModel & { appId: string };

export const columns: ColumnDef<DesignsTableRow>[] = [
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
        href={`/dashboard/gift-card-studio/edit?id=${row.original._id}`}
        variant="underline"
      >
        {row.original.name}
      </Link>
    ),
    id: "name",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >("designs.table.columns.name", "string", giftCardStudioAdminNamespace),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
        giftCardStudioAdminNamespace,
      );
      return row.original.isArchived
        ? t("designs.table.status.archived")
        : t("designs.table.status.active");
    },
    id: "status",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >("designs.table.columns.status", "string", giftCardStudioAdminNamespace),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/gift-card-studio/purchases?designId=${row.original._id}`}
        variant="underline"
      >
        {row.original.purchasesCount ?? 0}
      </Link>
    ),
    id: "purchasesCount",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >(
      "designs.table.columns.purchasesCount",
      "number",
      giftCardStudioAdminNamespace,
    ),
    enableSorting: false,
  },
  {
    cell: ({ row }) =>
      DateTime.fromJSDate(row.original.createdAt).toLocaleString(
        DateTime.DATETIME_MED,
      ),
    id: "createdAt",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >("designs.table.columns.createdAt", "date", giftCardStudioAdminNamespace),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <CellAction design={row.original} appId={row.original.appId} />
    ),
  },
];
