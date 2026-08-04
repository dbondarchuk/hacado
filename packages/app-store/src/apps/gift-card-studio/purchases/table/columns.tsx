"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useI18n } from "@timelish/i18n/client";
import { Button, Link, Spinner, useCurrencyFormat } from "@timelish/ui";
import {
  CustomerName,
  tableSortHeader,
  tableSortNoopFunction,
} from "@timelish/ui-admin";
import { GiftCardPaymentsDialog } from "@timelish/ui-admin-kit";
import { DateTime } from "luxon";
import { PurchasedGiftCardListModel } from "../../models";
import { getFileName } from "../../service/utils";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { CellAction } from "./cell-action";
import { GiftCardDetailDialog } from "./gift-card-detail-dialog";

export const columns: ColumnDef<PurchasedGiftCardListModel>[] = [
  {
    id: "code",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >("purchases.table.columns.code", "string", giftCardStudioAdminNamespace),
    cell: ({ row }) => (
      <GiftCardDetailDialog purchase={row.original}>
        <Button variant="link-dashed" className="p-0 h-auto font-medium">
          {row.original.giftCardCode ?? row.original.giftCardId}
        </Button>
      </GiftCardDetailDialog>
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "giftCardPdf",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >(
      "purchases.table.columns.giftCardPdf",
      "string",
      giftCardStudioAdminNamespace,
    ),
    cell: ({ row }) => {
      const purchase = row.original;
      const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
        giftCardStudioAdminNamespace,
      );
      if (purchase.cardGenerationStatus !== "completed") {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Spinner className="h-4 w-4" />
            <span>{t("purchases.table.detail.generating")}</span>
          </div>
        );
      }

      const pdfFileName = getFileName(
        purchase.appId,
        purchase._id,
        "gift-card",
        "pdf",
      );

      return (
        <Button asChild variant="link-dashed" className="p-0 h-auto">
          <a
            href={`/files/${pdfFileName}`}
            target="_blank"
            rel="noopener noreferrer"
            download="gift-card.pdf"
          >
            {t("purchases.table.download.giftCard")}
          </a>
        </Button>
      );
    },
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "invoicePdf",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >(
      "purchases.table.columns.invoicePdf",
      "string",
      giftCardStudioAdminNamespace,
    ),
    cell: ({ row }) => {
      const purchase = row.original;
      const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
        giftCardStudioAdminNamespace,
      );
      if (purchase.invoiceGenerationStatus !== "completed") {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Spinner className="h-4 w-4" />
            <span>{t("purchases.table.detail.generating")}</span>
          </div>
        );
      }

      const pdfFileName = getFileName(
        purchase.appId,
        purchase._id,
        "invoice",
        "pdf",
      );

      return (
        <Button asChild variant="link-dashed" className="p-0 h-auto">
          <a
            href={`/files/${pdfFileName}`}
            target="_blank"
            rel="noopener noreferrer"
            download="invoice.pdf"
          >
            {t("purchases.table.download.invoice")}
          </a>
        </Button>
      );
    },
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "amountPurchased",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >(
      "purchases.table.columns.amountPurchased",
      "number",
      giftCardStudioAdminNamespace,
    ),
    cell: ({ row }) => {
      const currencyFormat = useCurrencyFormat();
      return currencyFormat(row.original.amountPurchased);
    },
    sortingFn: tableSortNoopFunction,
  },
  // {
  //   id: "amountLeft",
  //   header: tableSortHeader<
  //     GiftCardStudioAdminNamespace,
  //     GiftCardStudioAdminKeys
  //   >(
  //     "purchases.table.columns.amountLeft",
  //     "number",
  //     giftCardStudioAdminNamespace,
  //   ),
  //   cell: ({ row }) =>
  //     row.original.amountLeft != null ? `$${row.original.amountLeft}` : "-",
  //   sortingFn: tableSortNoopFunction,
  // },
  {
    id: "status",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >("purchases.table.columns.status", "string", giftCardStudioAdminNamespace),
    cell: ({ row }) => {
      const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
        giftCardStudioAdminNamespace,
      );
      return row.original.status === "active"
        ? t("purchases.table.status.active")
        : t("purchases.table.status.inactive");
    },
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "paymentMethod",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >(
      "purchases.table.columns.paymentMethod",
      "string",
      giftCardStudioAdminNamespace,
    ),
    cell: ({ row }) => {
      const tAdmin = useI18n("admin");
      return tAdmin(
        `common.labels.paymentMethod.${row.original.paymentMethod}`,
      );
    },
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "paymentsCount",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >(
      "purchases.table.columns.paymentsCount",
      "number",
      giftCardStudioAdminNamespace,
    ),
    cell: ({ row }) => {
      return (
        <GiftCardPaymentsDialog giftCardId={row.original.giftCardId}>
          <Button variant="link-dashed" className="p-0 h-auto">
            {row.original.paymentsCount}
          </Button>
        </GiftCardPaymentsDialog>
      );
    },
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "customer",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >(
      "purchases.table.columns.customer",
      "string",
      giftCardStudioAdminNamespace,
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/customers/${row.original.customerId}`}
        variant="underline"
      >
        <CustomerName customer={row.original.customer} />
      </Link>
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "toName",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >("purchases.table.columns.toName", "string", giftCardStudioAdminNamespace),
    cell: ({ row }) => row.original.toName ?? "-",
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "toEmail",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >(
      "purchases.table.columns.toEmail",
      "string",
      giftCardStudioAdminNamespace,
    ),
    cell: ({ row }) => row.original.toEmail ?? "-",
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "design",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >("purchases.table.columns.design", "string", giftCardStudioAdminNamespace),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/gift-card-studio/edit?id=${row.original.designId}`}
        variant="underline"
      >
        {row.original.designName}
      </Link>
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "createdAt",
    header: tableSortHeader<
      GiftCardStudioAdminNamespace,
      GiftCardStudioAdminKeys
    >(
      "purchases.table.columns.createdAt",
      "date",
      giftCardStudioAdminNamespace,
    ),
    cell: ({ row }) =>
      DateTime.fromJSDate(row.original.createdAt).toLocaleString(
        DateTime.DATETIME_MED,
      ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction purchase={row.original} />,
  },
];
