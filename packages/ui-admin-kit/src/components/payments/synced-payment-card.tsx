"use client";

import { AvailableApps } from "@hacado/app-store";
import { AdminKeys, useI18n, useLocale } from "@hacado/i18n/client";
import { HydratedSyncedPayment, SyncedPaymentStatus } from "@hacado/types";
import {
  Button,
  Card,
  Link,
  cn,
  useCurrencyFormat,
  useTimeZone,
} from "@hacado/ui";
import { CustomerName } from "@hacado/ui-admin";
import {
  ArrowLeftRight,
  Check,
  CreditCard,
  EyeOffIcon,
  Pencil,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import type { ReactNode } from "react";

const STATUS_BADGE_CLASS: Record<SyncedPaymentStatus, string> = {
  matched:
    "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  unmatched: "bg-muted text-muted-foreground border border-border",
  confirmed:
    "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  rejected:
    "bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  ignored: "bg-muted text-muted-foreground border border-border",
};

export type SyncedPaymentCardProps = {
  payment: HydratedSyncedPayment;
  disabled?: boolean;
  onConfirm?: () => void;
  onReject?: () => void;
  onIgnore?: () => void;
  onAssignSuggestion?: (appointmentId: string) => void;
  onAssignOther?: () => void;
  onEditAmounts?: () => void;
};

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <p className="text-sm font-normal uppercase tracking-wider text-muted-foreground">
    {children}
  </p>
);

const DetailRow = ({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn("flex items-center justify-between gap-3 text-sm", className)}
  >
    <span className="text-muted-foreground">{label}</span>
    <div className="text-right">{children}</div>
  </div>
);

export const SyncedPaymentCard = ({
  payment,
  disabled = false,
  onConfirm,
  onReject,
  onIgnore,
  onAssignSuggestion,
  onAssignOther,
  onEditAmounts,
}: SyncedPaymentCardProps) => {
  const t = useI18n("admin");
  const tAll = useI18n();
  const locale = useLocale();
  const timeZone = useTimeZone();
  const currencyFormat = useCurrencyFormat();

  const app = AvailableApps[payment.appName];
  const providerLabel = app?.displayName
    ? tAll.has(app.displayName)
      ? tAll(app.displayName)
      : app.displayName
    : payment.appName.charAt(0).toUpperCase() + payment.appName.slice(1);
  const ProviderLogo = app?.Logo ?? CreditCard;

  const paymentAmount =
    payment.paymentAmount ?? payment.amount - (payment.inferredTip ?? 0);
  const tip = payment.inferredTip ?? 0;
  const showBreakdown =
    payment.appointmentId != null || payment.paymentAmount != null || tip > 0;

  const otherSuggestions = (payment.suggestions || []).filter(
    (suggestion) => suggestion.appointmentId !== payment.appointmentId,
  );

  const formatDateTime = (value: Date | string) =>
    DateTime.fromJSDate(new Date(value), { zone: timeZone }).toLocaleString(
      DateTime.DATETIME_MED,
      { locale },
    );

  const formatAppointmentTime = (value: Date | string) =>
    DateTime.fromJSDate(new Date(value), { zone: timeZone }).toLocaleString(
      { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
      { locale },
    );

  const showConfirm =
    !!onConfirm && !!payment.appointmentId && payment.status === "matched";
  const showEdit =
    !!onEditAmounts && !!payment.appointmentId && payment.status !== "rejected";
  const showRejectBtn =
    !!onReject && !!payment.appointmentId && payment.status !== "rejected";
  const showPrimaryActions = showConfirm || showEdit || showRejectBtn;
  const showReassign = payment.status !== "rejected" && !!onAssignOther;
  const showIgnore =
    payment.status !== "ignored" && payment.status !== "rejected" && !!onIgnore;
  const showSuggestions = !!onAssignSuggestion && otherSuggestions.length > 0;

  return (
    <Card className="overflow-hidden shadow-sm flex flex-col">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
            <ProviderLogo className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-base">{providerLabel}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("syncedPayments.subtitle.synced")}
              {" · "}
              {formatDateTime(payment.transactionTime)}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-sm font-medium",
            STATUS_BADGE_CLASS[payment.status],
          )}
        >
          {t(`syncedPayments.status.${payment.status}` as AdminKeys)}
        </span>
      </div>

      <div className="border-t border-border" />

      <div className="space-y-3 p-4 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <SectionLabel>
            {t("syncedPayments.sections.totalReceived")}
          </SectionLabel>
          <span className="text-xl font-bold tabular-nums tracking-tight">
            {currencyFormat(payment.amount)}
          </span>
        </div>

        {showBreakdown && (
          <div className="space-y-1.5">
            <DetailRow label={t("syncedPayments.fields.paymentAmount")}>
              <span className="font-medium tabular-nums">
                {currencyFormat(paymentAmount)}
              </span>
            </DetailRow>
            {tip > 0 && (
              <DetailRow label={t("syncedPayments.fields.tip")}>
                <span className="font-medium tabular-nums text-green-600 dark:text-green-400">
                  +{currencyFormat(tip)}
                </span>
              </DetailRow>
            )}
          </div>
        )}
      </div>

      {payment.appointment && (
        <>
          <div className="border-t border-border" />
          <div className="space-y-2.5 p-4 flex-1">
            <SectionLabel>
              {t("syncedPayments.sections.matchedTo")}
            </SectionLabel>
            <DetailRow label={t("syncedPayments.fields.appointment")}>
              <Link href={`/dashboard/appointments/${payment.appointment._id}`}>
                {payment.appointment.option.name}
                {" · "}
                {formatAppointmentTime(payment.appointment.dateTime)}
              </Link>
            </DetailRow>
            {payment.appointment.customer && (
              <DetailRow label={t("syncedPayments.fields.customer")}>
                <Link
                  href={`/dashboard/customers/${payment.appointment.customer._id}`}
                >
                  <CustomerName customer={payment.appointment.customer} />
                </Link>
              </DetailRow>
            )}
          </div>
        </>
      )}

      {showSuggestions && (
        <>
          <div className="border-t border-border" />
          <div className="space-y-2.5 p-4">
            <SectionLabel>
              {t("syncedPayments.sections.suggestions")}
            </SectionLabel>
            {otherSuggestions.map((suggestion) => (
              <div
                key={suggestion.appointmentId}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {suggestion.appointment
                      ? `${suggestion.appointment.option.name} · ${formatAppointmentTime(
                          suggestion.appointment.dateTime,
                        )}`
                      : suggestion.appointmentId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("syncedPayments.fields.matchScore", {
                      score: Math.round(suggestion.score * 100),
                    })}
                    {suggestion.reason
                      ? ` · ${t(
                          `syncedPayments.reason.${suggestion.reason}` as AdminKeys,
                        )}`
                      : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onAssignSuggestion?.(suggestion.appointmentId)}
                >
                  {payment.appointmentId
                    ? t("syncedPayments.actions.reassign")
                    : t("syncedPayments.actions.assign")}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {(showPrimaryActions || showReassign || showIgnore) && (
        <>
          <div className="border-t border-border" />
          <div className="flex flex-col gap-2 p-4">
            {showPrimaryActions && (
              <div className="flex gap-2">
                {showConfirm && (
                  <Button
                    className="flex-1"
                    disabled={disabled}
                    onClick={onConfirm}
                  >
                    <Check />
                    {t("syncedPayments.actions.confirm")}
                  </Button>
                )}
                {showEdit && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={disabled}
                    onClick={onEditAmounts}
                  >
                    <Pencil />
                    {t("syncedPayments.actions.editAmounts")}
                  </Button>
                )}
                {showRejectBtn && (
                  <Button
                    variant="outline-destructive"
                    className="flex-1"
                    disabled={disabled}
                    onClick={onReject}
                  >
                    <X />
                    {t("syncedPayments.actions.reject")}
                  </Button>
                )}
              </div>
            )}

            {(showReassign || showIgnore) && (
              <div className="grid grid-cols-2 gap-2">
                {showReassign && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={disabled}
                    onClick={onAssignOther}
                  >
                    <ArrowLeftRight />
                    {payment.appointmentId
                      ? t("syncedPayments.actions.reassignOther")
                      : t("syncedPayments.actions.assignOther")}
                  </Button>
                )}
                {showIgnore && (
                  <Button
                    variant="outline"
                    className={cn("w-full", !showReassign && "col-span-2")}
                    disabled={disabled}
                    onClick={onIgnore}
                  >
                    <EyeOffIcon />
                    {t("syncedPayments.actions.ignore")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
};
