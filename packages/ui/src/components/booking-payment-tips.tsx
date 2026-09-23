"use client";

import { useI18n } from "@hacado/i18n/client";
import { isBookingTipsVisible, type ResolvedBookingTips } from "@hacado/types";
import { useCurrencyFormat } from "../context/config";
import { BookingTipsPicker } from "./tips-picker";

export type BookingPaymentTipsProps = {
  tips?: ResolvedBookingTips | null;
  chargeAmount: number;
  amountTotal: number;
  amountPaid: number;
  disabled?: boolean;
  className?: string;
  onDebouncedTipAmountChange: (tipAmount: number) => void;
};

export function BookingPaymentTips({
  tips,
  chargeAmount,
  amountTotal,
  amountPaid,
  disabled,
  className,
  onDebouncedTipAmountChange,
}: BookingPaymentTipsProps) {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const enabled = isBookingTipsVisible(
    tips,
    chargeAmount,
    amountTotal,
    amountPaid,
  );

  return (
    <BookingTipsPicker
      enabled={enabled}
      presets={tips?.presets ?? []}
      baseAmount={chargeAmount}
      formatCurrency={currencyFormat}
      labels={{
        title: i18n("booking.payment.tips.title"),
        none: i18n("booking.payment.tips.none"),
        custom: i18n("booking.payment.tips.custom"),
        customAmount: i18n("booking.payment.tips.customAmount"),
        tip: i18n("booking.payment.tips.tip"),
        total: i18n("booking.payment.tips.total"),
        preset: (percent) =>
          i18n("booking.payment.tips.preset", { percent: String(percent) }),
      }}
      disabled={disabled}
      className={className}
      onDebouncedTipAmountChange={onDebouncedTipAmountChange}
    />
  );
}
