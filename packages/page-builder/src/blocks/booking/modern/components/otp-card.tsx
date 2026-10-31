"use client";

import { bookingApi } from "@hacado/api-sdk/client/booking";
import { useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui/button";
import { Input } from "@hacado/ui/input";
import React from "react";
import { BookingOtpForm } from "../../components/otp-form";
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
        <BookingOtpForm
          fields={{ ...fields, name: localName.trim() || fields.name }}
          hideContactFields={!collectContact}
          onVerified={async (result) => {
            setOtpVerified(true);
            setFields({
              ...fields,
              name: result.name || localName.trim() || fields.name,
              email: result.email || fields.email,
              phone: result.phone || fields.phone,
              smsConsent: result.smsConsent === true,
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
              bookingApi.trackPaymentReached(payment.intent?.amount);
              setCurrentStep("payment");
            }
          }}
        />
      )}
    </div>
  );
};
