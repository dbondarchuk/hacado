"use client";

import { useI18n } from "@hacado/i18n/client";
import { Payment, PaymentSummary } from "@hacado/types";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@hacado/ui";
import { useRouter } from "next/navigation";
import React from "react";
import { PaymentCard } from "./payment-card";

export type PaymentDetailsDialogProps = {
  payment: Payment | PaymentSummary;
  children: React.ReactNode;
};

export const PaymentDetailsDialog: React.FC<PaymentDetailsDialogProps> = ({
  payment,
  children,
}) => {
  const router = useRouter();
  const t = useI18n("admin");

  const onPaymentUpdated = () => {
    router.refresh();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">{t("paymentsList.title")}</DialogTitle>
        <PaymentCard
          payment={payment}
          onDelete={onPaymentUpdated}
          onRefund={onPaymentUpdated}
        />
      </DialogContent>
    </Dialog>
  );
};
