"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  TableDateTime,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin/data-table";
import { Checkbox } from "@hacado/ui/checkbox";
import { Link } from "@hacado/ui/link";
import { ColumnDef } from "@tanstack/react-table";
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
        size="sm"
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
        size="sm"
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
    cell: ({ row }) => <TableDateTime value={row.original.createdAt} />,
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
