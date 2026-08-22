"use client";

import { useI18n } from "@hacado/i18n/client";
import { AppointmentFields } from "@hacado/types";
import {
  CustomerOtpVerified,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@hacado/ui";
import { BookingOtpForm } from "./otp-form";

type BookingOtpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: AppointmentFields;
  /** When false, show email/phone inputs. Default true. */
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
        <BookingOtpForm
          fields={fields}
          hideContactFields={hideContactFields}
          existingCustomerOnly={existingCustomerOnly}
          onVerified={async (result) => {
            await onVerified(result);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
