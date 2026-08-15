"use client";

import React from "react";

import { PaymentAppForms } from "@hacado/app-store/payment-forms";
import { useI18n } from "@hacado/i18n/client";
import { useCurrencyFormat } from "@hacado/ui";
import { useModifyAppointmentFormContext } from "./context";

export const PaymentCard: React.FC = () => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const {
    appointment,
    paymentInformation: paymentForm,
    fields,
    onSubmit,
    type,
  } = useModifyAppointmentFormContext();
  if (!paymentForm) return null;

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
      <Form
        fields={fields}
        {...paymentForm.formProps}
        intent={paymentForm.intent}
        onSubmit={onSubmit}
      />
    </div>
  );
};
