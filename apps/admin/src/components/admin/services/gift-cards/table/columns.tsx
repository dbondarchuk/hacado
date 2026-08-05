"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { GiftCardListModel } from "@hacado/types";
import { Badge, Button, Checkbox, Link, useCurrencyFormat } from "@hacado/ui";
import {
  CustomerName,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin";
import { GiftCardPaymentsDialog } from "@hacado/ui-admin-kit";
import { DateTime } from "luxon";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback } from "react";
import { CellAction } from "./cell-action";

export const columns: ColumnDef<GiftCardListModel>[] = [
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
        href={`/dashboard/services/gift-cards/${row.original._id}`}
        variant="underline"
      >
        {row.original.code}
      </Link>
    ),
    id: "name",
    header: tableSortHeader(
      "services.giftCards.table.columns.code",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      const { status, expiresAt, amountLeft } = row.original;

      const now = new Date();
      const isExpired = !!expiresAt && expiresAt <= now;
      const isNoAmountLeft = amountLeft <= 0;
      const isActive = status === "active" && !isExpired && !isNoAmountLeft;

      const badges = [];

      // Primary badge (active/inactive using existing logic)
      if (isActive) {
        badges.push(
          <Badge key="active" variant="default">
            {t("services.giftCards.table.statusBadges.active")}
          </Badge>,
        );
      } else {
        badges.push(
          <Badge key="inactive" variant="secondary">
            {t("services.giftCards.table.statusBadges.inactive")}
          </Badge>,
        );
      }

      // Extra badges for derived states
      if (isExpired) {
        badges.push(
          <Badge key="expired" variant="destructive">
            {t("services.giftCards.table.statusBadges.expired")}
          </Badge>,
        );
      }

      if (isNoAmountLeft) {
        badges.push(
          <Badge key="noAmountLeft" variant="outline">
            {t("services.giftCards.table.statusBadges.noAmountLeft")}
          </Badge>,
        );
      }

      return <div className="flex flex-wrap gap-1">{badges}</div>;
    },
    id: "status",
    header: tableSortHeader(
      "services.giftCards.table.columns.status",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const currencyFormat = useCurrencyFormat();
      return currencyFormat(row.original.amount);
    },
    id: "amount",
    header: tableSortHeader(
      "services.giftCards.table.columns.amount",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const currencyFormat = useCurrencyFormat();
      return currencyFormat(row.original.amountLeft);
    },
    id: "amountLeft",
    header: tableSortHeader(
      "services.giftCards.table.columns.amountLeft",
      "number",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const [_, setQuery] = useQueryState(
        "ts",
        parseAsString.withDefault("").withOptions({ shallow: false }),
      );

      const onRefund = useCallback(() => {
        setQuery(new Date().getTime().toString());
      }, [setQuery]);

      return (
        <GiftCardPaymentsDialog
          giftCardId={row.original._id}
          onRefund={onRefund}
        >
          <Button variant="link-dashed">{row.original.paymentsCount}</Button>
        </GiftCardPaymentsDialog>
      );
    },
    id: "payments",
    header: tableSortHeader(
      "services.giftCards.table.columns.payments",
      "number",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return row.original.expiresAt
        ? DateTime.fromJSDate(row.original.expiresAt).toLocaleString(
            DateTime.DATETIME_MED,
            { locale },
          )
        : "";
    },
    id: "expiresAt",
    header: tableSortHeader(
      "services.giftCards.table.columns.expiresAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      return (
        <Link
          href={`/dashboard/customers/${row.original.customerId}`}
          variant="underline"
        >
          <CustomerName customer={row.original.customer} />
        </Link>
      );
    },
    id: "customer",
    header: tableSortHeader(
      "services.giftCards.table.columns.customer",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      return row.original.createdAt
        ? DateTime.fromJSDate(row.original.createdAt).toLocaleString(
            DateTime.DATETIME_MED,
            { locale },
          )
        : "";
    },
    id: "createdAt",
    header: tableSortHeader(
      "services.giftCards.table.columns.createdAt",
      "date",
      "admin",
    ),
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
      "services.discounts.table.columns.updatedAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction giftCard={row.original} />,
  },
];
