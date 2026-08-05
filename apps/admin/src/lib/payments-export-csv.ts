import type { AdminKeys } from "@hacado/i18n";
import type { PaymentExportRow } from "@hacado/types";
import { formatAmountString, rowsToCsv } from "@hacado/utils";

const COLUMN_KEYS = [
  "paidAt",
  "paymentId",
  "amount",
  "status",
  "type",
  "description",
  "method",
  "providerApp",
  "transactionId",
  "source",
  "customerName",
  "customerEmail",
  "customerPhone",
  "appointmentId",
  "appointmentDateTime",
  "appointmentStatus",
  "optionName",
  "addons",
  "appointmentTotal",
  "feesTotal",
  "feesDetail",
  "totalRefunded",
  "amountAfterRefunds",
  "netAmount",
  "giftCardCode",
  "lastRefundDate",
] as const;

type ColumnKey = (typeof COLUMN_KEYS)[number];

const columnKey = (key: ColumnKey): AdminKeys =>
  `paymentsList.exportCsvColumns.${key}`;

function formatDate(value?: Date): string {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function getFeesTotal(payment: PaymentExportRow): number {
  return payment.fees?.reduce((sum, fee) => sum + fee.amount, 0) ?? 0;
}

function getTotalRefunded(payment: PaymentExportRow): number {
  return payment.refunds?.reduce((sum, refund) => sum + refund.amount, 0) ?? 0;
}

function getFeesDetail(payment: PaymentExportRow): string {
  if (!payment.fees?.length) {
    return "";
  }

  return payment.fees
    .map((fee) => `${fee.type}:${formatAmountString(fee.amount)}`)
    .join("; ");
}

function getLastRefundDate(payment: PaymentExportRow): string {
  if (!payment.refunds?.length) {
    return "";
  }

  const dates = payment.refunds
    .map((refund) => refund.refundedAt)
    .filter((date): date is Date => !!date)
    .map((date) => (date instanceof Date ? date : new Date(date)))
    .filter((date) => !Number.isNaN(date.getTime()));

  if (!dates.length) {
    return "";
  }

  const latest = dates.reduce(
    (max, date) => (date > max ? date : max),
    dates[0],
  );
  return latest.toISOString();
}

function paymentToRow(payment: PaymentExportRow): string[] {
  const feesTotal = getFeesTotal(payment);
  const totalRefunded = getTotalRefunded(payment);
  const appName = "appName" in payment ? payment.appName : undefined;
  const externalId = "externalId" in payment ? payment.externalId : undefined;
  const source = "source" in payment ? payment.source : undefined;
  const giftCardCode =
    "giftCardCode" in payment ? payment.giftCardCode : undefined;

  return [
    formatDate(payment.paidAt),
    payment._id,
    formatAmountString(payment.amount),
    payment.status,
    payment.type,
    payment.description,
    payment.method,
    appName ?? "",
    externalId ?? "",
    source ?? "",
    payment.customerName ?? "",
    payment.customerEmail ?? "",
    payment.customerPhone ?? "",
    payment.appointmentId ?? "",
    formatDate(payment.appointmentDateTime),
    payment.appointmentStatus ?? "",
    payment.serviceName ?? "",
    payment.addonNames?.join("; ") ?? "",
    payment.appointmentTotalPrice != null
      ? formatAmountString(payment.appointmentTotalPrice)
      : "",
    formatAmountString(feesTotal),
    getFeesDetail(payment),
    formatAmountString(totalRefunded),
    formatAmountString(payment.amount - totalRefunded),
    formatAmountString(payment.amount - feesTotal - totalRefunded),
    giftCardCode ?? "",
    getLastRefundDate(payment),
  ];
}

export function buildPaymentsExportCsv(
  payments: PaymentExportRow[],
  t: (key: AdminKeys) => string,
): string {
  const headers = COLUMN_KEYS.map((key) => t(columnKey(key)));
  const rows = payments.map(paymentToRow);

  return rowsToCsv(headers, rows);
}

export const PAYMENTS_EXPORT_COLUMN_KEYS = COLUMN_KEYS;
