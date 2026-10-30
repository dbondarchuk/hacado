import { useI18n, useLocale } from "@hacado/i18n/client";
import { effectiveAddonPrice } from "@hacado/types/booking";
import { cn } from "@hacado/ui/cn";
import { useCurrencyFormat } from "@hacado/ui/context";
import { durationToTime } from "@hacado/utils";
import { DateTime } from "luxon";
import type { ReactNode } from "react";
import { useScheduleContext } from "./context";

function SummaryRow({
  label,
  value,
  className,
  valueClassName,
  truncate = "label",
}: {
  label: ReactNode;
  value?: ReactNode;
  className?: string;
  valueClassName?: string;
  /** Which side truncates when space is tight. */
  truncate?: "label" | "value";
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 py-2.5 border-b border-dotted border-border last:border-b-0 min-w-0",
        className,
      )}
    >
      <span
        className={cn(
          "text-sm text-muted-foreground",
          truncate === "label" ? "min-w-0 flex-1 truncate" : "shrink-0",
        )}
      >
        {label}
      </span>
      {value != null && value !== "" && (
        <span
          className={cn(
            "text-sm text-foreground text-right",
            truncate === "value" ? "min-w-0 flex-1 truncate" : "shrink-0",
            valueClassName,
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}

export const BookingSummaryCard = ({ className }: { className?: string }) => {
  const {
    selectedAppointmentOption,
    selectedAddons,
    selectedMember,
    isAnySpecialist,
    dateTime,
    duration,
    basePrice,
    price,
    discount,
    discountAmount,
    giftCards,
    purchasePackageId,
    customerPackageId,
    packages,
  } = useScheduleContext();
  const t = useI18n("translation");
  const locale = useLocale();
  const currencyFormat = useCurrencyFormat();

  const purchasingPackage = packages?.find(
    (pkg) => pkg._id === purchasePackageId,
  );
  const hideLinePrices = !!purchasePackageId || !!customerPackageId;
  const servicePrice = selectedAppointmentOption
    ? selectedAppointmentOption.durationType === "fixed"
      ? (selectedMember?.effectivePrice ?? selectedAppointmentOption.price)
      : (selectedMember?.effectivePrice ??
        selectedAppointmentOption.pricePerHour)
    : undefined;
  const serviceLabel = selectedAppointmentOption
    ? (purchasingPackage?.name ?? selectedAppointmentOption.name)
    : undefined;
  const servicePriceLabel =
    !selectedAppointmentOption || hideLinePrices
      ? undefined
      : selectedAppointmentOption.durationType === "flexible" && servicePrice
        ? t("booking.option.price_per_hour", {
            price: currencyFormat(servicePrice),
          })
        : servicePrice
          ? currencyFormat(servicePrice)
          : undefined;
  const specialistName = selectedMember?.member.name
    ? selectedMember.member.name
    : isAnySpecialist
      ? t("booking.specialist.any.title")
      : undefined;
  const whenLabel = dateTime
    ? DateTime.fromJSDate(dateTime.date)
        .set({
          hour: dateTime.time.hour,
          minute: dateTime.time.minute,
        })
        .setZone(dateTime.timeZone)
        .setLocale(locale)
        .toLocaleString({
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
    : undefined;
  const giftCardsApplied =
    giftCards?.reduce((sum, giftCard) => sum + giftCard.appliedAmount, 0) || 0;
  const totalDue = Math.max(0, price - giftCardsApplied);
  const showTotals = !!basePrice;

  return (
    <div
      className={cn(
        "border rounded-lg p-4 summary-card summary-container min-w-0 overflow-hidden",
        className,
      )}
    >
      <h3 className="text-base font-semibold text-foreground mb-1 summary-card-title truncate">
        {t("booking.summary.title")}
      </h3>
      {!selectedAppointmentOption ? (
        <p className="text-sm text-muted-foreground summary-card-empty">
          {t("booking.summary.empty")}
        </p>
      ) : (
        <>
          <div className="summary-card-rows min-w-0">
            <SummaryRow label={serviceLabel} value={servicePriceLabel} />
            {!purchasePackageId &&
              selectedAddons.map((addon) => {
                const addonPrice = effectiveAddonPrice(
                  addon.price,
                  addon.staff,
                  selectedMember?.member.id,
                );
                return (
                  <SummaryRow
                    key={addon._id}
                    label={addon.name}
                    value={
                      !hideLinePrices && addonPrice
                        ? currencyFormat(addonPrice)
                        : undefined
                    }
                  />
                );
              })}
            {!!specialistName && (
              <SummaryRow
                label={t("booking.summary.with")}
                value={specialistName}
                truncate="value"
              />
            )}
            {!!whenLabel && (
              <SummaryRow
                label={t("booking.summary.when")}
                value={whenLabel}
                truncate="value"
              />
            )}
            {!!duration && (
              <SummaryRow
                label={t("booking.summary.estimates.duration")}
                value={t(
                  "common.formats.durationHourMin",
                  durationToTime(duration),
                )}
                truncate="value"
              />
            )}
            {!!discount && !!discountAmount && (
              <SummaryRow
                label={discount.code || t("booking.review.price.discount")}
                value={currencyFormat(-discountAmount)}
                valueClassName="text-destructive"
                truncate="label"
              />
            )}
            {giftCards?.map((giftCard) => (
              <SummaryRow
                key={giftCard.code}
                label={giftCard.code}
                value={currencyFormat(-giftCard.appliedAmount)}
                valueClassName="text-destructive"
                truncate="label"
              />
            ))}
          </div>
          {showTotals && (
            <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t summary-card-total min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">
                {t("booking.summary.total")}
              </span>
              <span className="text-sm font-semibold text-foreground shrink-0">
                {currencyFormat(totalDue)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
