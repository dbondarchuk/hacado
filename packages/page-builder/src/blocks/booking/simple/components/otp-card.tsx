"use client";

import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import React from "react";
import { BookingOtpForm } from "../../components/otp-form";
import { useScheduleContext } from "./context";

export const OtpCard: React.FC = () => {
  const t = useI18n("translation");
  const {
    fields,
    setFields,
    setOtpVerified,
    setStep,
    fetchPaymentInformation,
    setPaymentInformation,
    onSubmit,
  } = useScheduleContext();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">
        {t("booking.otp.title")}
      </h2>
      <BookingOtpForm
        fields={fields}
        onVerified={async (result) => {
          setOtpVerified(true);
          setFields({
            ...fields,
            name: result.name || fields.name,
            email: result.email || fields.email,
            phone: result.phone || fields.phone,
          });
          const payment = await fetchPaymentInformation();
          setPaymentInformation(payment);
          if (!payment || payment.intent?.status === "paid") {
            onSubmit(payment?.intent?._id);
          } else {
            clientApi.booking.trackPaymentReached(payment.intent?.amount);
            setStep("payment");
          }
        }}
      />
    </div>
  );
};
