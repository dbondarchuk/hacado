"use client";

import { useI18n } from "@hacado/i18n/client";
import type { AdminKeys } from "@hacado/i18n/keys";
import { PaymentSummary } from "@hacado/types/booking";
import {
  getPaymentDescription,
  getPaymentMethod,
  getPaymentStatusColor,
  PaymentDetailsDialog,
} from "@hacado/ui-admin-kit/payments";
import {
  TableDateTime,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin/data-table";
import { Badge } from "@hacado/ui/badge";
import { Button } from "@hacado/ui/button";
import { useCurrencyFormat } from "@hacado/ui/context";
import { Link } from "@hacado/ui/link";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";

function PaymentDateCell({ payment }: { payment: PaymentSummary }) {
  const rawDate = payment.paidAt ?? payment.createdAt;

  return (
    <PaymentDetailsDialog payment={payment}>
      <Button
        variant="link-dashed"
        size="sm"
        className="p-0 h-auto font-medium"
      >
        <TableDateTime value={rawDate} />
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
              href={`/dashboard/catalog/gift-cards/${payment.giftCardId}`}
              variant="underline"
              size="sm"
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
        return "-";
      }

      return (
        <Link
          href={`/dashboard/customers/${customerId}`}
          variant="underline"
          size="sm"
        >
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
        return "-";
      }

      return (
        <Link
          href={`/dashboard/appointments/${appointmentId}`}
          variant="underline"
          size="sm"
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
