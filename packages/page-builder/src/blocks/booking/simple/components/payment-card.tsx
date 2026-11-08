"use client";

import React, { useCallback, useRef } from "react";

import { PaymentAppForms } from "@hacado/app-store/payment-forms";
import { useI18n } from "@hacado/i18n/client";
import { BookingPaymentReceived } from "@hacado/ui/booking-payment-received";
import { BookingPaymentTips } from "@hacado/ui/booking-payment-tips";
import { useCurrencyFormat } from "@hacado/ui/context";
import { formatAmount } from "@hacado/utils/currency";
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

  const markPaidAndSubmit = useCallback(() => {
    if (!paymentForm) return;

    setPaymentInformation({
      ...paymentForm,
      intent: { ...paymentForm.intent, status: "paid" },
    });

    void onSubmit(paymentForm.intent._id);
  }, [onSubmit, paymentForm, setPaymentInformation]);

  if (!paymentForm) return null;

  const isPaid = paymentForm.intent.status === "paid";
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
      {!isPaid && (
        <BookingPaymentTips
          tips={appointmentOption.tips}
          chargeAmount={paymentForm.amount}
          amountTotal={paymentForm.amountTotal}
          amountPaid={paymentForm.amountPaid}
          disabled={isLoading}
          className="mb-4"
          onDebouncedTipAmountChange={handleTipAmountChange}
        />
      )}
      {isPaid ? (
        <BookingPaymentReceived
          isLoading={isLoading}
          onComplete={markPaidAndSubmit}
        />
      ) : (
        <Form
          {...paymentForm.formProps}
          intent={paymentForm.intent}
          onSubmit={markPaidAndSubmit}
        />
      )}
    </CardWithAppointmentInformation>
  );
};
