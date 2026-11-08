"use client";

import { useI18n } from "@hacado/i18n/client";
import { CheckCircle2 } from "lucide-react";
import { Button } from "./button";
import { Spinner } from "./spinner";

export type BookingPaymentReceivedProps = {
  onComplete: () => void;
  isLoading?: boolean;
  className?: string;
};

export function BookingPaymentReceived({
  onComplete,
  isLoading,
  className,
}: BookingPaymentReceivedProps) {
  const i18n = useI18n("translation");

  return (
    <div className={className}>
      <div className="rounded-lg border p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mb-2 text-base font-semibold text-foreground">
          {i18n("booking.payment.paymentReceivedTitle")}
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          {i18n("booking.payment.paymentReceivedDescription")}
        </p>
        <Button
          type="button"
          className="w-full"
          disabled={isLoading}
          onClick={onComplete}
        >
          {isLoading ? <Spinner className="mr-2" /> : null}
          {i18n("booking.payment.completeBooking")}
        </Button>
      </div>
    </div>
  );
}
