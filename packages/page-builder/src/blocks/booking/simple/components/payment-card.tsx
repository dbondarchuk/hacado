"use client";

import React from "react";

import { PaymentAppForms } from "@timelish/app-store/payment-forms";
import { useI18n } from "@timelish/i18n/client";
import { useCurrencyFormat } from "@timelish/ui";
import { formatAmount } from "@timelish/utils";
import { CardWithAppointmentInformation } from "./card-with-info";
import { useScheduleContext } from "./context";

export const PaymentCard: React.FC = () => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const {
    paymentInformation: paymentForm,
    price,
    onSubmit,
  } = useScheduleContext();
  if (!paymentForm) return null;

  const Form = PaymentAppForms[paymentForm.intent.appName];

  const isFullPayment = paymentForm.intent.amount === price;
  const percentage = formatAmount((paymentForm.intent.amount / price) * 100);

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
            amount: currencyFormat(paymentForm.intent.amount),
          },
        )}
      </div>
      <Form
        {...paymentForm.formProps}
        intent={paymentForm.intent}
        onSubmit={onSubmit}
      />
    </CardWithAppointmentInformation>
  );
};
