"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { GiftCardListModel } from "@hacado/types/booking";
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
import { ToggleLeft, ToggleRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export const SetStatusSelectedGiftCardsButton: React.FC<{
  selected: GiftCardListModel[];
  status: "active" | "inactive";
}> = ({ selected, status }) => {
  const t = useI18n("admin");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();

  const action = async () => {
    try {
      setIsLoading(true);

      const promise = adminApi.giftCards.setGiftCardsStatus(
        selected.map((g) => g._id),
        status,
      );

      await toastPromise(promise, {
        success:
          status === "active"
            ? t("catalog.giftCards.setStatusSelected.successActive")
            : t("catalog.giftCards.setStatusSelected.successInactive"),
        error: t("catalog.giftCards.setStatusSelected.error"),
      });

      router.refresh();
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const disabled = isLoading || !selected?.length;

  const titleKey =
    status === "active"
      ? "catalog.giftCards.setStatusSelected.confirmTitleActive"
      : "catalog.giftCards.setStatusSelected.confirmTitleInactive";
  const buttonKey =
    status === "active"
      ? "catalog.giftCards.setStatusSelected.buttonActive"
      : "catalog.giftCards.setStatusSelected.buttonInactive";

  return (
    <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          aria-label={t(buttonKey, { count: selected.length })}
        >
          {isLoading && <Spinner />}
          {status === "active" ? (
            <ToggleRight className="h-4 w-4" />
          ) : (
            <ToggleLeft className="h-4 w-4" />
          )}
          <span className="max-md:hidden">
            {t(buttonKey, { count: selected.length })}
          </span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(titleKey)}</AlertDialogTitle>
          <AlertDialogDescription>
            <p>{t("catalog.giftCards.setStatusSelected.confirmDescription")}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("catalog.giftCards.setStatusSelected.cancel")}
          </AlertDialogCancel>
          <Button onClick={action} variant="default">
            {isLoading && <Spinner />}
            <span>
              {t(
                status === "active"
                  ? "catalog.giftCards.setStatusSelected.setActive"
                  : "catalog.giftCards.setStatusSelected.setInactive",
              )}
            </span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
