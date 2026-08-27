"use client";

import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Button, CustomerOtpForm, Input } from "@hacado/ui";
import React, { useCallback } from "react";
import { useScheduleContext } from "./context";

export const OtpCard: React.FC = () => {
  const t = useI18n("translation");
  const {
    fields,
    setFields,
    setOtpVerified,
    setCurrentStep,
    fetchPaymentInformation,
    setPaymentInformation,
    onSubmit,
    otpReturnStep,
    refreshBookingOptions,
  } = useScheduleContext();

  const [localName, setLocalName] = React.useState(fields.name ?? "");
  const collectContact = otpReturnStep === "packages";
  const nameOk = localName.trim().length > 0;

  const getAuthOptions = useCallback(
    () => clientApi.customerAuth.getAuthOptions(),
    [],
  );

  const otpFields = { ...fields, name: localName.trim() || fields.name };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">
        {t("booking.otp.title")}
      </h2>
      {collectContact ? (
        <div className="max-w-lg mx-auto w-full space-y-1">
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder={t("booking.otp.namePlaceholder")}
            aria-label={t("booking.otp.name")}
            className="auth-name-input"
          />
          {!nameOk ? (
            <p className="text-sm text-muted-foreground">
              {t("booking.otp.nameRequired")}
            </p>
          ) : null}
        </div>
      ) : null}
      {collectContact && !nameOk ? (
        <div className="max-w-lg mx-auto">
          <Button type="button" disabled className="w-full">
            {t("booking.otp.request")}
          </Button>
        </div>
      ) : (
        <CustomerOtpForm
          hideContactFields={!collectContact}
          initialEmail={fields.email}
          initialPhone={fields.phone}
          getAuthOptions={getAuthOptions}
          requestOtp={({ channel, email, phone }) =>
            clientApi.customerAuth.requestBookingOtp({
              name: otpFields.name,
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
              name: result.name || localName.trim() || fields.name,
              email: result.email || fields.email,
              phone: result.phone || fields.phone,
            });

            if (otpReturnStep === "packages" || otpReturnStep === "review") {
              await refreshBookingOptions?.();
              setCurrentStep(
                otpReturnStep === "packages" ? "option" : "review",
              );
              return;
            }

            const payment = await fetchPaymentInformation();
            setPaymentInformation(payment);
            if (!payment || payment.intent?.status === "paid") {
              onSubmit(payment?.intent?._id);
            } else {
              clientApi.booking.trackPaymentReached(payment.intent?.amount);
              setCurrentStep("payment");
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
      )}
    </div>
  );
};
