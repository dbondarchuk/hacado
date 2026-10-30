"use client";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { GiftCardListModel } from "@hacado/types/booking";
import {
  GiftCardPaymentsDialog,
  PaymentDetailsDialog,
} from "@hacado/ui-admin-kit";
import {
  CustomerName,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin/data-table";
import { Badge } from "@hacado/ui/badge";
import { Button } from "@hacado/ui/button";
import { Checkbox } from "@hacado/ui/checkbox";
import { useCurrencyFormat, useTimeZone } from "@hacado/ui/context";
import { Link } from "@hacado/ui/link";
import { ColumnDef } from "@tanstack/react-table";
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
        href={`/dashboard/catalog/gift-cards/${row.original._id}`}
        variant="underline"
      >
        {row.original.code}
      </Link>
    ),
    id: "name",
    header: tableSortHeader(
      "catalog.giftCards.table.columns.code",
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
            {t("catalog.giftCards.table.statusBadges.active")}
          </Badge>,
        );
      } else {
        badges.push(
          <Badge key="inactive" variant="secondary">
            {t("catalog.giftCards.table.statusBadges.inactive")}
          </Badge>,
        );
      }

      // Extra badges for derived states
      if (isExpired) {
        badges.push(
          <Badge key="expired" variant="destructive">
            {t("catalog.giftCards.table.statusBadges.expired")}
          </Badge>,
        );
      }

      if (isNoAmountLeft) {
        badges.push(
          <Badge key="noAmountLeft" variant="outline">
            {t("catalog.giftCards.table.statusBadges.noAmountLeft")}
          </Badge>,
        );
      }

      return <div className="flex flex-wrap gap-1">{badges}</div>;
    },
    id: "status",
    header: tableSortHeader(
      "catalog.giftCards.table.columns.status",
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
      "catalog.giftCards.table.columns.amount",
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
      "catalog.giftCards.table.columns.amountLeft",
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
      "catalog.giftCards.table.columns.payments",
      "number",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      const payment = row.original.payment;
      if (!payment) {
        return null;
      }

      return (
        <PaymentDetailsDialog payment={payment}>
          <Button variant="link-dashed" className="p-0 h-auto font-medium">
            {t(`common.labels.paymentMethod.${payment.method}`)}
          </Button>
        </PaymentDetailsDialog>
      );
    },
    id: "paymentMethod",
    header: tableSortHeader(
      "catalog.giftCards.table.columns.paymentMethod",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      const timeZone = useTimeZone();
      return row.original.expiresAt
        ? DateTime.fromJSDate(row.original.expiresAt)
            .setZone(timeZone)
            .toLocaleString(DateTime.DATETIME_MED, { locale })
        : "";
    },
    id: "expiresAt",
    header: tableSortHeader(
      "catalog.giftCards.table.columns.expiresAt",
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
      "catalog.giftCards.table.columns.customer",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const locale = useLocale();
      const timeZone = useTimeZone();
      return row.original.createdAt
        ? DateTime.fromJSDate(row.original.createdAt)
            .setZone(timeZone)
            .toLocaleString(DateTime.DATETIME_MED, { locale })
        : "";
    },
    id: "createdAt",
    header: tableSortHeader(
      "catalog.giftCards.table.columns.createdAt",
      "date",
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
      "catalog.discounts.table.columns.updatedAt",
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
