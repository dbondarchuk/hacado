"use client";

import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppointmentFields } from "@hacado/types";
import { CustomerOtpForm, CustomerOtpVerified } from "@hacado/ui";
import { useCallback } from "react";

type BookingOtpFormProps = {
  fields: AppointmentFields;
  /** When false, show email/phone inputs (package booking entry). Default true. */
  hideContactFields?: boolean;
  /**
   * Package redeem: verify an existing customer only - do not upsert.
   * Also skips sending name (not required for this path).
   */
  existingCustomerOnly?: boolean;
  onVerified: (result: CustomerOtpVerified) => void | Promise<void>;
};

export const BookingOtpForm: React.FC<BookingOtpFormProps> = ({
  fields,
  hideContactFields = true,
  existingCustomerOnly = false,
  onVerified,
}) => {
  const t = useI18n("translation");

  const getAuthOptions = useCallback(
    () => clientApi.customerAuth.getAuthOptions(),
    [],
  );

  return (
    <CustomerOtpForm
      hideContactFields={hideContactFields}
      initialEmail={fields.email}
      initialPhone={fields.phone}
      getAuthOptions={getAuthOptions}
      requestOtp={({ channel, email, phone }) =>
        clientApi.customerAuth.requestBookingOtp({
          ...(existingCustomerOnly
            ? { existingOnly: true }
            : { name: fields.name }),
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
      onVerified={(result) => onVerified(result)}
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
        sent: existingCustomerOnly
          ? t("booking.otp.sentIfMatch")
          : t("booking.otp.sent"),
        invalid: t("booking.otp.invalid"),
        requestError: t("booking.otp.requestError"),
        verifyError: t("booking.otp.verifyError"),
      }}
    />
  );
};
