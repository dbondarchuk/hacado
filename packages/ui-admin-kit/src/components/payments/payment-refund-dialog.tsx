"use client";

import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { Payment, PaymentSummary } from "@timelish/types";
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
  Checkbox,
  CurrencyPercentageInput,
  Label,
  Spinner,
  toast,
  useCurrencyFormat,
} from "@timelish/ui";
import { formatAmount } from "@timelish/utils";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { getPaymentMethod } from "./payment-method-display";

export function canRefundPayment(payment: Payment | PaymentSummary): boolean {
  const totalRefunded =
    payment.refunds?.reduce((acc, refund) => acc + refund.amount, 0) || 0;

  return (
    (payment.status === "paid" ||
      (payment.status === "refunded" && totalRefunded < payment.amount)) &&
    (payment.method === "online" || payment.method === "gift-card")
  );
}

export type PaymentRefundDialogProps = {
  payment: Payment | PaymentSummary;
  onSuccess?: (payment: Payment) => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const PaymentRefundDialog: React.FC<PaymentRefundDialogProps> = ({
  payment,
  onSuccess,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const t = useI18n();
  const router = useRouter();
  const currencyFormat = useCurrencyFormat();
  const { method, ...rest } = payment;

  const [internalOpen, setInternalOpen] = useState(false);
  const [isRefundInProgress, setIsRefundInProgress] = useState(false);

  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = controlledOnOpenChange ?? setInternalOpen;

  const totalRefunded =
    payment.refunds?.reduce((acc, refund) => acc + refund.amount, 0) || 0;

  const [amount, setAmount] = useState(payment.amount - totalRefunded);
  const [refundFees, setRefundFees] = useState(false);

  const commitValue = useCallback(
    (value: number) => {
      const newAmount = Math.min(
        payment.amount - totalRefunded,
        formatAmount(value),
      );

      setAmount(newAmount);
    },
    [payment.amount, totalRefunded],
  );

  const refundableAmount =
    payment.amount -
    totalRefunded -
    (!refundFees
      ? payment.fees?.reduce((acc, fee) => acc + fee.amount, 0) || 0
      : 0);

  useEffect(() => {
    if (amount > refundableAmount) {
      commitValue(refundableAmount);
    }
  }, [amount, refundableAmount, commitValue]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        setAmount(payment.amount - totalRefunded);
      }
    },
    [setIsOpen, payment.amount, totalRefunded],
  );

  const refund = useCallback(
    async (refundAmount: number) => {
      try {
        if (
          refundAmount <= 0 ||
          refundAmount > payment.amount - totalRefunded
        ) {
          throw new Error("Invalid refund amount");
        }

        setIsRefundInProgress(true);

        const result = await adminApi.payments.refundPayment(
          payment._id,
          refundAmount,
        );

        if (!result.success) {
          throw new Error(`Refund has failed: ${result.error}`);
        }

        toast.success(t("admin.payment.toasts.refundSuccess"), {
          description: t("admin.payment.toasts.refundSuccessDescription"),
        });

        onSuccess?.(result.payment);
        setIsOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(t("admin.payment.toasts.refundError"), {
          description: t("admin.payment.toasts.refundErrorDescription"),
        });
      } finally {
        setIsRefundInProgress(false);
      }
    },
    [
      payment._id,
      payment.amount,
      totalRefunded,
      t,
      onSuccess,
      setIsOpen,
      router,
    ],
  );

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      {children && (
        <AlertDialogTrigger asChild disabled={isRefundInProgress}>
          {children}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("admin.payment.card.confirmRefund")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.payment.card.confirmRefundDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted/30 dark:bg-muted/80 text-foreground font-normal rounded-lg p-4">
          <h4 className="font-semibold mb-3">
            {t("admin.payment.card.refundDetails")}
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-sm">
                {t("admin.payment.card.paymentMethod")}
              </span>
              <span className="font-semibold">
                {t(
                  getPaymentMethod(
                    method,
                    "appName" in rest ? rest.appName : undefined,
                  ),
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t("admin.payment.card.originalAmount")}</span>
              <span className="font-semibold">
                {currencyFormat(payment.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t("admin.payment.card.totalRefunded")}</span>
              <span className="font-semibold">
                {currencyFormat(totalRefunded)}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-semibold">
                <div className="flex flex-col gap-2">
                  <span>{t("admin.payment.card.refundAmount")}</span>
                  {payment.fees?.length && payment.fees.length > 0 && (
                    <div className="flex flex-row gap-2 items-center">
                      <Checkbox
                        id={`refund-fees-${payment._id}`}
                        checked={refundFees}
                        onCheckedChange={(checked) => setRefundFees(!!checked)}
                        className="bg-background dark:bg-background"
                      />
                      <Label htmlFor={`refund-fees-${payment._id}`}>
                        {t("admin.payment.card.refundFees")}
                      </Label>
                    </div>
                  )}
                </div>
                <CurrencyPercentageInput
                  maxAmount={refundableAmount}
                  value={amount}
                  onChange={commitValue}
                />
              </div>
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRefundInProgress}>
            {t("admin.payment.card.cancel")}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => refund(amount)}
            disabled={
              isRefundInProgress ||
              amount <= 0 ||
              amount > payment.amount - totalRefunded
            }
          >
            {isRefundInProgress && <Spinner />}{" "}
            {t("admin.payment.card.confirmRefundButton", {
              amountFormatted: currencyFormat(amount),
            })}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
