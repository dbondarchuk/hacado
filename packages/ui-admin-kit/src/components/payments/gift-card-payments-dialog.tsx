"use client";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Payment, PaymentSummary } from "@hacado/types";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ScrollArea,
  Skeleton,
  toast,
} from "@hacado/ui";
import { AddUpdatePaymentDialog, PaymentCard } from "@hacado/ui-admin-kit";
import { BanknoteArrowUp } from "lucide-react";
import { useState } from "react";

export const GiftCardPaymentsDialog: React.FC<{
  giftCardId: string;
  children: React.ReactNode;
  onRefund?: (payment: Payment) => void;
}> = ({ giftCardId, children, onRefund }) => {
  const t = useI18n("admin");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentSummary[]>([]);

  const getPayments = async () => {
    setIsLoading(true);
    try {
      const payments = await adminApi.giftCards.getGiftCardPayments(giftCardId);
      setPayments(payments);
    } catch (error: any) {
      console.error(error);
      toast.error(t("common.toasts.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) {
      getPayments();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[80%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("services.giftCards.table.payments.title")}
          </DialogTitle>
          <DialogDescription>
            {t("services.giftCards.table.payments.description")}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(80vh-100px)] @container/payments-dialog-scroll-area">
          <AddUpdatePaymentDialog
            giftCardId={giftCardId}
            onSuccess={(payment) => {
              setPayments([...payments, payment]);
            }}
          >
            <Button variant="primary" className="w-full">
              <BanknoteArrowUp />
              {t("services.giftCards.table.payments.addPayment")}
            </Button>
          </AddUpdatePaymentDialog>
          {payments.length > 0 || isLoading ? (
            <div className="grid grid-cols-1 @2xl/payments-dialog-scroll-area:grid-cols-2 @4xl/payments-dialog-scroll-area:grid-cols-3 gap-2 py-2">
              {!isLoading
                ? payments.map((payment) => (
                    <PaymentCard
                      payment={payment}
                      key={payment._id}
                      onRefund={onRefund}
                    />
                  ))
                : Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton className="w-full h-80" key={index} />
                  ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2 bg-card p-4 rounded border py-2 mt-2">
              <div className="font-semibold flex flex-row gap-1 items-center">
                {t("services.giftCards.table.payments.noPayments")}
              </div>
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{t("common.buttons.close")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
