"use client";

import { bookingApi } from "@hacado/api-sdk/client/booking";
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
            smsConsent: result.smsConsent === true,
          });
          const payment = await fetchPaymentInformation();
          setPaymentInformation(payment);
          if (!payment || payment.intent?.status === "paid") {
            onSubmit(payment?.intent?._id);
          } else {
            bookingApi.trackPaymentReached(payment.intent?.amount);
            setStep("payment");
          }
        }}
      />
    </div>
  );
};
