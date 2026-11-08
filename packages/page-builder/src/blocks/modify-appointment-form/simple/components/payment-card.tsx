"use client";

import React, { useCallback } from "react";

import { PaymentAppForms } from "@hacado/app-store/payment-forms";
import { useI18n } from "@hacado/i18n/client";
import { BookingPaymentReceived } from "@hacado/ui/booking-payment-received";
import { useCurrencyFormat } from "@hacado/ui/context";
import { useModifyAppointmentFormContext } from "./context";

export const PaymentCard: React.FC = () => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const {
    appointment,
    paymentInformation: paymentForm,
    setPaymentInformation,
    fields,
    onSubmit,
    type,
  } = useModifyAppointmentFormContext();

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

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-3">
        <h2 className="mt-0 text-xl">
          {i18n(`modification.feeRequired.${type}.title`)}
        </h2>
      </div>
      <div className="text-sm mb-3">
        {i18n(`modification.feeRequired.${type}.description`, {
          totalPrice: currencyFormat(appointment?.price ?? 0),
          amount: currencyFormat(paymentForm.intent.amount),
        })}
      </div>
      {isPaid ? (
        <BookingPaymentReceived onComplete={markPaidAndSubmit} />
      ) : (
        <Form
          fields={fields}
          {...paymentForm.formProps}
          intent={paymentForm.intent}
          onSubmit={markPaidAndSubmit}
        />
      )}
    </div>
  );
};
