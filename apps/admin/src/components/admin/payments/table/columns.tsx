"use client";

import { AdminKeys, useI18n, useLocale } from "@hacado/i18n/client";
import { PaymentSummary } from "@hacado/types";
import { Badge, Button, Link, useCurrencyFormat } from "@hacado/ui";
import { tableSortHeader, tableSortNoopFunction } from "@hacado/ui-admin";
import {
  getPaymentDescription,
  getPaymentMethod,
  getPaymentStatusColor,
  PaymentDetailsDialog,
} from "@hacado/ui-admin-kit";
import { ColumnDef } from "@tanstack/react-table";
import { DateTime } from "luxon";
import { CellAction } from "./cell-action";

function PaymentDateCell({ payment }: { payment: PaymentSummary }) {
  const locale = useLocale();
  const paidAt = payment.paidAt;
  const dateTime =
    typeof paidAt === "string"
      ? DateTime.fromISO(paidAt)
      : DateTime.fromJSDate(paidAt);

  return (
    <PaymentDetailsDialog payment={payment}>
      <Button variant="link-dashed" className="p-0 h-auto font-medium">
        {dateTime.toLocaleString(DateTime.DATETIME_MED, { locale })}
      </Button>
    </PaymentDetailsDialog>
  );
}

export const columns: ColumnDef<PaymentSummary>[] = [
  {
    id: "paidAt",
    header: tableSortHeader("paymentsList.columns.date", "date", "admin"),
    sortingFn: tableSortNoopFunction,
    cell: ({ row }) => <PaymentDateCell payment={row.original} />,
  },
  {
    id: "amount",
    header: tableSortHeader("paymentsList.columns.amount", "number", "admin"),
    sortingFn: tableSortNoopFunction,
    cell: ({ row }) => {
      const currencyFormat = useCurrencyFormat();
      return (
        <span className="font-medium tabular-nums">
          {currencyFormat(row.original.amount)}
        </span>
      );
    },
  },
  {
    id: "description",
    header: tableSortHeader("paymentsList.columns.type", "string", "admin"),
    sortingFn: tableSortNoopFunction,
    cell: ({ row }) => {
      const t = useI18n();
      const { description } = row.original;
      const descriptionKey = getPaymentDescription(description);
      return t.has(descriptionKey) ? t(descriptionKey) : description;
    },
  },
  {
    id: "method",
    header: tableSortHeader("paymentsList.columns.method", "string", "admin"),
    sortingFn: tableSortNoopFunction,
    cell: ({ row }) => {
      const t = useI18n();
      const payment = row.original;
      const methodKey = getPaymentMethod(
        payment.method,
        "appName" in payment ? payment.appName : undefined,
      );

      if (payment.method === "gift-card") {
        return (
          <span className="flex items-center gap-1">
            <span>{t("admin.payment.methods.giftCard")}</span>
            <Link
              href={`/dashboard/services/gift-cards/${payment.giftCardId}`}
              variant="underline"
            >
              {payment.giftCardCode}
            </Link>
          </span>
        );
      }
      return t.has(methodKey) ? t(methodKey) : payment.method;
    },
  },
  {
    id: "customerName",
    header: tableSortHeader("paymentsList.columns.customer", "string", "admin"),
    sortingFn: tableSortNoopFunction,
    cell: ({ row }) => {
      const { customerName, customerId } = row.original;
      if (!customerName || !customerId) {
        return "—";
      }

      return (
        <Link href={`/dashboard/customers/${customerId}`} variant="underline">
          {customerName}
        </Link>
      );
    },
  },
  {
    id: "serviceName",
    header: tableSortHeader(
      "paymentsList.columns.appointment",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
    cell: ({ row }) => {
      const { serviceName, appointmentId } = row.original;
      if (!serviceName || !appointmentId) {
        return "—";
      }

      return (
        <Link
          href={`/dashboard/appointments/${appointmentId}`}
          variant="underline"
        >
          {serviceName}
        </Link>
      );
    },
  },
  {
    id: "status",
    header: tableSortHeader("paymentsList.columns.status", "string", "admin"),
    sortingFn: tableSortNoopFunction,
    cell: ({ row }) => {
      const t = useI18n("admin");
      const { status } = row.original;
      return (
        <Badge className={getPaymentStatusColor(status)}>
          {t(`common.labels.paymentStatus.${status}` as AdminKeys)}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction payment={row.original} />,
    enableSorting: false,
  },
];
