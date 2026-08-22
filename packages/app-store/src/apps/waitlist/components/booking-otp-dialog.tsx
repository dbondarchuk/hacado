"use client";

import { clientApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppointmentFields } from "@hacado/types";
import {
  CustomerOtpForm,
  CustomerOtpVerified,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@hacado/ui";

type BookingOtpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: AppointmentFields;
  hideContactFields?: boolean;
  existingCustomerOnly?: boolean;
  description?: string;
  onVerified: (result: CustomerOtpVerified) => void | Promise<void>;
};

export const BookingOtpDialog: React.FC<BookingOtpDialogProps> = ({
  open,
  onOpenChange,
  fields,
  hideContactFields = true,
  existingCustomerOnly = false,
  description,
  onVerified,
}) => {
  const t = useI18n("translation");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("booking.otp.title")}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <CustomerOtpForm
          hideContactFields={hideContactFields}
          initialEmail={fields.email}
          initialPhone={fields.phone}
          getAuthOptions={() => clientApi.customerAuth.getAuthOptions()}
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
          onVerified={async (result) => {
            await onVerified(result);
            onOpenChange(false);
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
            sent: existingCustomerOnly
              ? t("booking.otp.sentIfMatch")
              : t("booking.otp.sent"),
            invalid: t("booking.otp.invalid"),
            requestError: t("booking.otp.requestError"),
            verifyError: t("booking.otp.verifyError"),
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
