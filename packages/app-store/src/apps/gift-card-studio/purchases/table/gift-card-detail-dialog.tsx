"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { GiftCardListModel } from "@hacado/types";
import {
  AutoSkeleton,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Link,
  ScrollArea,
  useCurrencyFormat,
} from "@hacado/ui";
import { CustomerName } from "@hacado/ui-admin";
import { GiftCardPaymentsDialog } from "@hacado/ui-admin-kit";
import { DateTime } from "luxon";
import React, { useMemo, useState } from "react";
import { PurchasedGiftCardListModel } from "../../models";
import { getFileName } from "../../service/utils";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";

export const GiftCardDetailDialog: React.FC<{
  purchase: PurchasedGiftCardListModel;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}> = ({
  purchase,
  children,
  open: propOpen,
  onOpenChange: propOnOpenChange,
}) => {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const tAdmin = useI18n("admin");
  const currencyFormat = useCurrencyFormat();

  const [open, setOpen] = useState(propOpen ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [giftCard, setGiftCard] = useState<GiftCardListModel | null>(null);

  const getGiftCard = async () => {
    setIsLoading(true);
    try {
      const giftCard = await adminApi.giftCards.getGiftCard(
        purchase.giftCardId,
      );
      setGiftCard(giftCard);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (open && !giftCard && !isLoading) {
      getGiftCard();
    }

    propOnOpenChange?.(open);
  };

  const fileUrls = useMemo(() => {
    const giftCardImageFileName = getFileName(
      purchase.appId,
      purchase._id,
      "gift-card",
      "png",
    );
    const giftCardPdfFileName = getFileName(
      purchase.appId,
      purchase._id,
      "gift-card",
      "pdf",
    );
    const invoicePdfFileName = getFileName(
      purchase.appId,
      purchase._id,
      "invoice",
      "pdf",
    );
    return {
      giftCardImageUrl:
        purchase.cardGenerationStatus === "completed"
          ? `/files/${giftCardImageFileName}`
          : null,
      giftCardPdfUrl:
        purchase.cardGenerationStatus === "completed"
          ? `/files/${giftCardPdfFileName}`
          : null,
      invoicePdfUrl:
        purchase.invoiceGenerationStatus === "completed"
          ? `/files/${invoicePdfFileName}`
          : null,
    };
  }, [purchase.appId, purchase._id, purchase.cardGenerationStatus]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!!children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("purchases.table.giftCardDetail.title")}</DialogTitle>
          <DialogDescription>
            {t("purchases.table.giftCardDetail.description")}
          </DialogDescription>
        </DialogHeader>
        {/* {giftCard && !isLoading && false ? ( */}
        <ScrollArea className="max-h-[calc(80vh-100px)] @container/payments-dialog-scroll-area">
          <AutoSkeleton loading={isLoading}>
            <div className="space-y-4">
              {fileUrls.giftCardImageUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    <span data-autoskeleton-ignore>
                      {t("purchases.table.giftCardDetail.preview")}
                    </span>
                  </p>
                  <img
                    src={fileUrls.giftCardImageUrl}
                    alt={t("purchases.table.giftCardDetail.preview")}
                    className="max-w-full h-auto rounded border"
                  />
                </div>
              )}
              <dl className="grid gap-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-muted-foreground">
                    <span data-autoskeleton-ignore>
                      {t("purchases.table.giftCardDetail.code")}
                    </span>
                  </dt>
                  <dd className="font-medium">
                    <span>{purchase.giftCardCode ?? "-"}</span>
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-muted-foreground">
                    <span data-autoskeleton-ignore>
                      {t("purchases.table.giftCardDetail.customer")}
                    </span>
                  </dt>
                  <dd className="font-medium">
                    <Link
                      href={`/dashboard/customers/${purchase.customerId}`}
                      variant="underline"
                    >
                      <span>
                        <CustomerName customer={purchase.customer} />
                      </span>
                    </Link>
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-muted-foreground">
                    <span data-autoskeleton-ignore>
                      {t("purchases.table.giftCardDetail.amountPurchased")}
                    </span>
                  </dt>
                  <dd className="font-medium">
                    <span>{currencyFormat(purchase.amountPurchased)}</span>
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-muted-foreground">
                    <span data-autoskeleton-ignore>
                      {t("purchases.table.giftCardDetail.amountLeft")}
                    </span>
                  </dt>
                  <dd className="font-medium">
                    <span>{currencyFormat(giftCard?.amountLeft ?? 0)}</span>
                  </dd>
                </div>
                {giftCard?.expiresAt && (
                  <div className="grid grid-cols-2 gap-2">
                    <dt className="text-muted-foreground">
                      <span data-autoskeleton-ignore>
                        {t("purchases.table.giftCardDetail.expiresAt")}
                      </span>
                    </dt>
                    <dd className="font-medium">
                      {DateTime.fromJSDate(giftCard.expiresAt).toLocaleString(
                        DateTime.DATETIME_MED,
                      )}
                    </dd>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-muted-foreground">
                    <span data-autoskeleton-ignore>
                      {t("purchases.table.giftCardDetail.status")}
                    </span>
                  </dt>
                  <dd className="font-medium">
                    <span>
                      {purchase.status === "active"
                        ? t("purchases.table.status.active")
                        : t("purchases.table.status.inactive")}
                    </span>
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-muted-foreground">
                    <span data-autoskeleton-ignore>
                      {t("purchases.table.giftCardDetail.paymentsCount")}
                    </span>
                  </dt>
                  <dd className="font-medium">
                    <GiftCardPaymentsDialog giftCardId={purchase.giftCardId}>
                      <Button
                        variant="link-dashed"
                        size="md"
                        className="p-0 h-auto"
                      >
                        {giftCard?.paymentsCount ?? 0}
                      </Button>
                    </GiftCardPaymentsDialog>
                  </dd>
                </div>
                {purchase.toName && (
                  <div className="grid grid-cols-2 gap-2">
                    <dt className="text-muted-foreground">
                      <span data-autoskeleton-ignore>
                        {t("purchases.table.giftCardDetail.recipient")}
                      </span>
                    </dt>
                    <dd className="font-medium">
                      <span>{purchase.toName}</span>
                    </dd>
                  </div>
                )}
                {purchase.toEmail && (
                  <div className="grid grid-cols-2 gap-2">
                    <dt className="text-muted-foreground">
                      <span data-autoskeleton-ignore>
                        {t("purchases.table.giftCardDetail.recipientEmail")}
                      </span>
                    </dt>
                    <dd className="font-medium">
                      <span>{purchase.toEmail}</span>
                    </dd>
                  </div>
                )}
                {purchase.message && (
                  <div className="grid grid-cols-2 gap-2">
                    <dt className="text-muted-foreground">
                      <span data-autoskeleton-ignore>
                        {t("purchases.table.giftCardDetail.message")}
                      </span>
                    </dt>
                    <dd className="font-medium">
                      <div className="whitespace-pre-wrap">
                        {purchase.message}
                      </div>
                    </dd>
                  </div>
                )}
              </dl>
              <div className="flex flex-wrap gap-2">
                {fileUrls.giftCardPdfUrl && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={fileUrls.giftCardPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download="gift-card.pdf"
                    >
                      {t("purchases.table.detail.downloadGiftCardPdf")}
                    </a>
                  </Button>
                )}
                {fileUrls.invoicePdfUrl && (
                  <Link
                    button
                    variant="outline"
                    size="sm"
                    href={fileUrls.invoicePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download="invoice.pdf"
                  >
                    {t("purchases.table.detail.downloadInvoice")}
                  </Link>
                )}
              </div>
            </div>
          </AutoSkeleton>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="sm">
              {tAdmin("common.buttons.close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
