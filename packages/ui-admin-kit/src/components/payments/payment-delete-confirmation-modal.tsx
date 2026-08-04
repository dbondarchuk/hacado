"use client";

import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { Payment } from "@timelish/types";
import {
  AlertDialog,
  AlertDialogAction,
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
  useCurrencyFormat,
} from "@timelish/ui";
import { Trash } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const PaymentDeleteConfirmationModal = ({
  payment,
  onDelete,
}: {
  payment: Payment;
  onDelete?: (payment: Payment) => void;
}) => {
  const t = useI18n("admin");
  const currencyFormat = useCurrencyFormat();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const onOpenChange = (open: boolean) => {
    if (!open && isLoading) {
      return;
    }

    setIsOpen(open);
  };

  const remove = async () => {
    setIsLoading(true);
    try {
      await toastPromise(adminApi.payments.deleteInstore(payment._id), {
        success: t("payment.card.deleteSuccess"),
        error: t("common.toasts.error"),
      });

      onDelete?.(payment);
      setIsOpen(false);
      router.refresh();
      setIsLoading(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash /> {t("payment.card.delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("payment.card.deleteConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("payment.card.deleteConfirmDescription", {
              amountFormatted: currencyFormat(payment.amount),
              date: DateTime.fromJSDate(payment.paidAt).toLocaleString(
                DateTime.DATETIME_FULL,
              ),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.buttons.cancel")}</AlertDialogCancel>
          <AlertDialogAction asChild variant="destructive">
            <Button onClick={remove} disabled={isLoading}>
              {isLoading && <Spinner />} {t("common.buttons.delete")}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
