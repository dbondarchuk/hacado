import { useFormatter, useI18n, useLocale } from "@hacado/i18n/client";
import { effectiveAddonPrice } from "@hacado/types/booking";
import { cn } from "@hacado/ui/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@hacado/ui/collapsible";
import { useCurrencyFormat } from "@hacado/ui/context";
import { durationToTime } from "@hacado/utils/time";
import { ChevronDown } from "lucide-react";
import { DateTime } from "luxon";
import type { ReactNode } from "react";
import { useState } from "react";
import { formatDateRange, groupWaitlistDates } from "../../../../models/utils";
import {
  WaitlistPublicKeys,
  WaitlistPublicNamespace,
  waitlistPublicNamespace,
} from "../../../../translations/types";
import { useScheduleContext } from "./context";

function SummaryRow({
  label,
  value,
  className,
  valueClassName,
  stacked,
  truncate = "label",
}: {
  label: ReactNode;
  value?: ReactNode;
  className?: string;
  valueClassName?: string;
  stacked?: boolean;
  /** Which side truncates when space is tight (ignored when stacked). */
  truncate?: "label" | "value";
}) {
  return (
    <div
      className={cn(
        "py-2.5 border-b border-dotted border-border last:border-b-0 min-w-0",
        stacked
          ? "flex flex-col gap-1.5"
          : "flex items-start justify-between gap-3",
        className,
      )}
    >
      <span
        className={cn(
          "text-sm text-muted-foreground",
          stacked
            ? "truncate"
            : truncate === "label"
              ? "min-w-0 flex-1 truncate"
              : "shrink-0",
        )}
      >
        {label}
      </span>
      {value != null && value !== "" && (
        <span
          className={cn(
            "text-sm text-foreground min-w-0",
            stacked
              ? "w-full"
              : truncate === "value"
                ? "flex-1 text-right truncate"
                : "shrink-0 text-right",
            valueClassName,
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}

function formatWaitlistDateRange(
  startDate: string,
  endDate: string,
  locale: string,
) {
  const start = DateTime.fromISO(startDate).setLocale(locale);
  const end = DateTime.fromISO(endDate).setLocale(locale);

  if (startDate === endDate) {
    return start.toLocaleString({ month: "short", day: "numeric" });
  }

  return `${start.toLocaleString({ month: "short", day: "numeric" })} – ${end.toLocaleString({ month: "short", day: "numeric" })}`;
}

function WaitlistWhenValue() {
  const { waitlistTimes } = useScheduleContext();
  const locale = useLocale();
  const formatter = useFormatter();
  const t = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );

  const [open, setOpen] = useState(false);

  if (waitlistTimes.asSoonAsPossible) {
    return (
      <span className="text-sm text-foreground">
        {t("block.asSoonAsPossible.label")}
      </span>
    );
  }

  const groups = groupWaitlistDates(waitlistTimes.dates || []);
  if (groups.length === 0) {
    return null;
  }

  const renderGroup = (group: (typeof groups)[number], compact: boolean) => {
    const dateLabel = compact
      ? formatWaitlistDateRange(group.startDate, group.endDate, locale)
      : formatDateRange(group.startDate, group.endDate, locale);

    const timesLabel = formatter.list(
      group.times.map((time) => t(`block.times.${time}`)),
      { type: "conjunction" },
    );

    return (
      <div key={group.id} className="space-y-0.5 min-w-0">
        <p className="text-sm text-foreground truncate">
          {dateLabel}
          {group.dates.length > 1 && (
            <span className="text-muted-foreground ml-1">
              {t("block.dates.groupLabel", { count: group.dates.length })}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground truncate">{timesLabel}</p>
      </div>
    );
  };

  if (groups.length === 1) {
    return renderGroup(groups[0], true);
  }

  const remaining = groups.length - 1;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      {renderGroup(groups[0], true)}
      <CollapsibleContent className="space-y-2 pt-2">
        {groups.slice(1).map((group) => renderGroup(group, true))}
      </CollapsibleContent>
      <CollapsibleTrigger className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        {open
          ? t("block.summary.showLess")
          : t("block.summary.showMore", { count: remaining })}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
    </Collapsible>
  );
}

export const BookingSummaryCard = ({ className }: { className?: string }) => {
  const {
    flow,
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
    waitlistTimes,
  } = useScheduleContext();

  const t = useI18n("translation");
  const tWaitlist = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );

  const locale = useLocale();
  const currencyFormat = useCurrencyFormat();
  const isWaitlist = flow === "waitlist";
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

  const bookingWhenLabel =
    !isWaitlist && dateTime
      ? DateTime.fromObject(
          {
            year: dateTime.date.getFullYear(),
            month: dateTime.date.getMonth() + 1,
            day: dateTime.date.getDate(),
            hour: dateTime.time.hour,
            minute: dateTime.time.minute,
          },
          { zone: dateTime.timeZone },
        )
          .setLocale(locale)
          .toLocaleString({
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
      : undefined;

  const showWaitlistWhen =
    isWaitlist &&
    (waitlistTimes.asSoonAsPossible ||
      (waitlistTimes.dates && waitlistTimes.dates.length > 0));

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
        {isWaitlist
          ? tWaitlist("block.summary.title")
          : t("booking.summary.title")}
      </h3>
      {!selectedAppointmentOption ? (
        <p className="text-sm text-muted-foreground summary-card-empty">
          {isWaitlist
            ? tWaitlist("block.summary.empty")
            : t("booking.summary.empty")}
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
            {showWaitlistWhen && (
              <SummaryRow
                label={tWaitlist("block.when.label")}
                value={<WaitlistWhenValue />}
                stacked
              />
            )}
            {!!bookingWhenLabel && (
              <SummaryRow
                label={t("booking.summary.when")}
                value={bookingWhenLabel}
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
