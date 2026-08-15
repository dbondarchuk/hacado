"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { GiftCardListModel } from "@hacado/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Spinner,
  toastPromise,
} from "@hacado/ui";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export const DeleteSelectedGiftCardsButton: React.FC<{
  selected: GiftCardListModel[];
}> = ({ selected }) => {
  const t = useI18n("admin");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const router = useRouter();
  const action = async () => {
    try {
      setIsLoading(true);

      await toastPromise(
        adminApi.giftCards.deleteGiftCards(selected.map((page) => page._id)),
        {
          success: t("services.giftCards.deleteSelected.success", {
            count: selected.length,
          }),
          error: t("services.giftCards.deleteSelected.error"),
        },
      );

      router.refresh();
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasPayments = selected.some((giftCard) => giftCard.paymentsCount > 0);
  const hasOnlinePayments = selected.some(
    (giftCard) => giftCard.payment.method === "online",
  );

  const disabled =
    isLoading ||
    !selected ||
    !selected.length ||
    hasPayments ||
    hasOnlinePayments ||
    selected.some((giftCard) => !!giftCard.source?.appId);
  return (
    <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          disabled={disabled}
          aria-label={t("services.giftCards.deleteSelected.button", {
            count: selected.length,
          })}
        >
          {isLoading && <Spinner />}
          <Trash className="h-4 w-4" />
          <span className="max-md:hidden">
            {t("services.giftCards.deleteSelected.button", {
              count: selected.length,
            })}
          </span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("services.giftCards.deleteSelected.confirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            <p>{t("services.giftCards.deleteSelected.confirmDescription")}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("services.giftCards.deleteSelected.cancel")}
          </AlertDialogCancel>
          <Button onClick={action} variant="default">
            {isLoading && <Spinner />}
            <span>{t("services.giftCards.deleteSelected.deleteSelected")}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
