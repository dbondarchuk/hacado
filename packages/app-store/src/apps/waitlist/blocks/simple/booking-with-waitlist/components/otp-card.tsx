"use client";

import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { CustomerOtpForm } from "@hacado/ui";
import React, { useCallback } from "react";
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

  const getAuthOptions = useCallback(
    () => clientApi.customerAuth.getAuthOptions(),
    [],
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">
        {t("booking.otp.title")}
      </h2>
      <CustomerOtpForm
        hideContactFields
        initialEmail={fields.email}
        initialPhone={fields.phone}
        getAuthOptions={getAuthOptions}
        requestOtp={({ channel, email, phone }) =>
          clientApi.customerAuth.requestBookingOtp({
            name: fields.name,
            email,
            phone,
            channel,
          })
        }
        verifyOtp={({ channel, email, phone, otp }) =>
          clientApi.customerAuth.verifyOtp(
            channel === "phone" ? { phone, otp } : { email, otp },
          )
        }
        onVerified={async (result) => {
          clientApi.booking.trackOtpVerified();
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
        labels={{
          descriptionEmailOnly: t("booking.otp.descriptionEmailOnly"),
          descriptionPhoneOnly: t("booking.otp.descriptionPhoneOnly"),
          descriptionEmailOrPhone: t("booking.otp.descriptionEmailOrPhone"),
          email: t("booking.otp.email"),
          phone: t("booking.otp.phone"),
          emailPlaceholder: t("booking.otp.emailPlaceholder"),
          phonePlaceholder: t("booking.otp.phonePlaceholder"),
          emailInvalid: t("booking.otp.emailInvalid"),
          phoneInvalid: t("booking.otp.phoneInvalid"),
          request: t("booking.otp.request"),
          requestBlocked: (values) => t("booking.otp.resendBlocked", values),
          hint: t("booking.otp.hint"),
          verify: t("booking.otp.verify"),
          sent: t("booking.otp.sent"),
          invalid: t("booking.otp.invalid"),
          requestError: t("booking.otp.requestError"),
          verifyError: t("booking.otp.verifyError"),
        }}
      />
    </div>
  );
};
