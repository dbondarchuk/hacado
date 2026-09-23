"use client";

import React, { useCallback, useRef } from "react";

import { PaymentAppForms } from "@hacado/app-store/payment-forms";
import { useI18n } from "@hacado/i18n/client";
import { BookingPaymentTips, useCurrencyFormat } from "@hacado/ui";
import { formatAmount } from "@hacado/utils";
import { CardWithAppointmentInformation } from "./card-with-info";
import { useScheduleContext } from "./context";

export const PaymentCard: React.FC = () => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const {
    paymentInformation: paymentForm,
    setPaymentInformation,
    fetchPaymentInformation,
    price,
    onSubmit,
    appointmentOption,
    isLoading,
  } = useScheduleContext();

  const lastTipAmountRef = useRef(0);

  const handleTipAmountChange = useCallback(
    async (tipAmount: number) => {
      if (tipAmount === lastTipAmountRef.current) {
        return;
      }

      lastTipAmountRef.current = tipAmount;
      try {
        const data = await fetchPaymentInformation(tipAmount);
        if (data) {
          setPaymentInformation(data);
        }
      } catch {
        // fetchPaymentInformation already toasts
      }
    },
    [fetchPaymentInformation, setPaymentInformation],
  );

  if (!paymentForm) return null;

  const Form = PaymentAppForms[paymentForm.intent.appName];

  const isFullPayment = paymentForm.amountTotal === price;
  const percentage = formatAmount(
    price ? (paymentForm.amountTotal / price) * 100 : 0,
  );

  return (
    <CardWithAppointmentInformation
      title={
        isFullPayment
          ? "booking.payment.fullPaymentRequiredTitle"
          : "booking.payment.depositRequiredTitle"
      }
    >
      <div className="text-sm mb-3">
        {i18n(
          isFullPayment
            ? "booking.payment.fullPaymentRequiredDescription"
            : "booking.payment.depositRequiredDescription",
          {
            percentage,
            amount: currencyFormat(paymentForm.amount),
          },
        )}
      </div>
      <BookingPaymentTips
        tips={appointmentOption.tips}
        chargeAmount={paymentForm.amount}
        amountTotal={paymentForm.amountTotal}
        amountPaid={paymentForm.amountPaid}
        disabled={isLoading}
        className="mb-4"
        onDebouncedTipAmountChange={handleTipAmountChange}
      />
      <Form
        {...paymentForm.formProps}
        intent={paymentForm.intent}
        onSubmit={onSubmit}
      />
    </CardWithAppointmentInformation>
  );
};
