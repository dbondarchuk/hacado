"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { Appointment, AppointmentStatus, Payment } from "@hacado/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Checkbox,
  cn,
  CurrencyPercentageInput,
  Label,
  Link,
  ScrollArea,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  useCurrencyFormat,
} from "@hacado/ui";
import { formatAmount } from "@hacado/utils";
import { CalendarX2 } from "lucide-react";
import { DateTime } from "luxon";
import React, { useCallback, useEffect, useId } from "react";
import {
  getPaymentDescription,
  getPaymentMethod,
  getPaymentMethodIcon,
  getPaymentStatusColor,
} from "../payments";
import { AppointmentActionButton } from "./action-button";

const PaymentRefundCard = ({
  payment,
  paymentState,
  setSelected,
}: {
  payment: Payment;
  paymentState?: {
    amount: number;
    selected: boolean;
    refundFees: boolean;
  };
  setSelected: (
    id: string,
    defaultAmount: number,
    selected?: boolean,
    amount?: number,
    refundFees?: boolean,
  ) => void;
}) => {
  const t = useI18n();
  const locale = useLocale();
  const currencyFormat = useCurrencyFormat();

  const dateTime =
    typeof payment.paidAt === "string"
      ? DateTime.fromISO(payment.paidAt)
      : DateTime.fromJSDate(payment.paidAt);

  const totalRefunded =
    payment.status === "refunded"
      ? payment.refunds?.reduce((acc, refund) => acc + refund.amount, 0) || 0
      : 0;

  const isSelected = !!paymentState?.selected;

  const [refundFees, setRefundFees] = React.useState(
    paymentState?.refundFees ?? false,
  );

  const isRefundable =
    payment.status === "paid" ||
    (payment.status === "refunded" && totalRefunded < payment.amount);

  const totalRefundedAmount = payment.amount - totalRefunded;
  const refundableAmount =
    totalRefundedAmount -
    (!refundFees
      ? payment.fees?.reduce((acc, fee) => acc + fee.amount, 0) || 0
      : 0);

  const refundAmount = paymentState?.amount ?? refundableAmount;
  const refundFeesId = useId();

  const commitValue = useCallback(
    (amount: number) => {
      setSelected(
        payment._id,
        refundableAmount,
        true,
        Math.min(refundableAmount, formatAmount(amount)),
        refundFees,
      );
    },
    [
      payment._id,
      refundableAmount,
      payment.amount,
      totalRefunded,
      setSelected,
      refundFees,
    ],
  );

  useEffect(() => {
    if (refundAmount > refundableAmount) {
      commitValue(refundableAmount);
    }
  }, [refundAmount, refundableAmount, commitValue]);

  return (
    <div
      className={cn(
        "w-full flex flex-col rounded-lg border border-border bg-background overflow-hidden relative cursor-pointer",
        paymentState?.selected && "bg-blue-50 dark:bg-sky-600/20",
      )}
      onClick={() => isRefundable && setSelected(payment._id, refundableAmount)}
    >
      {isRefundable && (
        <Checkbox
          id={`payment-${payment._id}`}
          checked={isSelected}
          className="absolute top-1 left-1 bg-background dark:bg-background"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          {getPaymentMethodIcon(
            payment.method,
            "appName" in payment ? payment.appName : undefined,
          )}
          <div>
            <p className="text-base font-medium text-foreground">
              {t(
                getPaymentMethod(
                  payment.method,
                  "appName" in payment ? payment.appName : undefined,
                ),
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(`admin.common.labels.paymentMethod.${payment.method}`)}
            </p>
          </div>
        </div>
        <Badge className={getPaymentStatusColor(payment.status)}>
          {t(`admin.common.labels.paymentStatus.${payment.status}`)}
        </Badge>
      </div>

      <div className="px-5 py-4 border-b border-border">
        <div className="flex justify-between items-baseline mb-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            {t("admin.appointments.declineDialog.amount")}
          </p>
          <p className="text-2xl font-medium text-foreground">
            {currencyFormat(payment.amount)}
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          {payment.fees && payment.fees.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t("admin.appointments.declineDialog.fees")}
                </span>
              </div>
              {payment.fees.map((fee, index) => (
                <div
                  className="flex justify-between items-center pl-4"
                  key={fee.type + index + fee.amount}
                >
                  <span className="text-sm text-muted-foreground">
                    {t(`admin.payment.feeTypes.${fee.type}`)}
                  </span>
                  <span className="text-sm font-medium text-foreground/60">
                    {currencyFormat(-1 * fee.amount)}
                  </span>
                </div>
              ))}
            </>
          )}
          {"externalId" in payment && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t("admin.appointments.declineDialog.transactionId")}
              </span>
              <code className="text-sm border border-border bg-muted font-mono px-2 py-0.5 rounded-lg">
                {payment.externalId}
              </code>
            </div>
          )}
          {"giftCardCode" in payment && !!payment.giftCardId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t("admin.appointments.declineDialog.giftCardCode")}
              </span>
              <Link
                href={`/dashboard/services/gift-cards/${payment.giftCardId}`}
                variant="none"
                className="text-sm font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg"
              >
                {payment.giftCardCode}
              </Link>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t("admin.appointments.declineDialog.timePaid")}
            </span>
            <TooltipResponsive>
              <TooltipResponsiveTrigger>
                <span className="text-sm text-foreground/60 underline decoration-dashed cursor-help">
                  {dateTime.setLocale(locale).toRelative()}
                </span>
              </TooltipResponsiveTrigger>
              <TooltipResponsiveContent>
                {dateTime.toLocaleString(DateTime.DATETIME_MED, {
                  locale,
                })}
              </TooltipResponsiveContent>
            </TooltipResponsive>
          </div>
          {payment.description && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {t("admin.appointments.declineDialog.paymentDescription")}
              </span>
              <span className="text-sm text-foreground/60">
                {t.has(getPaymentDescription(payment.description))
                  ? t(getPaymentDescription(payment.description))
                  : payment.description}
              </span>
            </div>
          )}

          {payment.status === "refunded" && (
            <div className="flex justify-between items-center text-base">
              <span className="text-foreground/80">
                {t("admin.appointments.declineDialog.refunded")}
              </span>
              <span className="text-foreground/60">
                {currencyFormat(totalRefunded)}
              </span>
            </div>
          )}
          <div
            className="flex justify-between items-center text-base"
            onClick={(e) => isSelected && e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <span className="text-foreground">
                {t(
                  isSelected
                    ? "admin.appointments.declineDialog.refundAmount"
                    : "admin.appointments.declineDialog.refundableAmount",
                )}
              </span>
              {isSelected && (
                <div className="flex flex-row gap-2 items-center">
                  <Checkbox
                    id={refundFeesId}
                    checked={refundFees}
                    onCheckedChange={(checked) => setRefundFees(!!checked)}
                  />
                  <Label htmlFor={refundFeesId}>
                    {t("admin.appointments.declineDialog.refundFees")}
                  </Label>
                </div>
              )}
            </div>
            {isSelected ? (
              <CurrencyPercentageInput
                maxAmount={refundableAmount}
                value={refundAmount}
                onChange={commitValue}
              />
            ) : (
              <span className="text-foreground">
                {currencyFormat(totalRefundedAmount)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AppointmentDeclineDialog: React.FC<{
  appointment: Appointment;
  trigger?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  onSuccess?: (status: AppointmentStatus) => void;
}> = ({ appointment, open, trigger, onClose, onSuccess }) => {
  const t = useI18n();
  const currencyFormat = useCurrencyFormat();

  const locale = useLocale();
  const [isLoading, setIsLoading] = React.useState(false);
  const [requestedByCustomer, setRequestedByCustomer] = React.useState(false);

  const onOpenChange = (open: boolean) => {
    if (!open) {
      setPaymentsIdsSelectionState({});
      onClose?.();
    }
  };

  const [paymentsIdsSelectionState, setPaymentsIdsSelectionState] =
    React.useState<
      Record<
        string,
        {
          amount: number;
          selected: boolean;
          refundFees: boolean;
        }
      >
    >({});

  const selectedPayments = Object.entries(paymentsIdsSelectionState)
    .filter(([id]) => !!paymentsIdsSelectionState[id]?.selected)
    .map(([id, { amount }]) => ({ id, amount }));

  const setSelected = (
    id: string,
    defaultAmount: number,
    selected?: boolean,
    amount?: number,
    refundFees?: boolean,
  ) => {
    setPaymentsIdsSelectionState((prev) => {
      return {
        ...prev,
        [id]: {
          amount:
            typeof amount === "undefined"
              ? (prev[id]?.amount ?? defaultAmount)
              : amount,
          selected:
            typeof selected === "undefined" ? !prev[id]?.selected : selected,
          refundFees:
            typeof refundFees === "undefined"
              ? !prev[id]?.refundFees
              : refundFees,
        },
      };
    });
  };

  const paymentsAvailableToRefund = React.useMemo(
    () =>
      appointment.payments?.filter(
        (payment) =>
          payment.method === "online" &&
          (payment.status === "paid" ||
            (payment.status === "refunded" &&
              (payment.refunds?.reduce(
                (acc, refund) => acc + refund.amount,
                0,
              ) || 0) < payment.amount)),
      ) ?? [],
    [appointment],
  );

  const refundSelected = async () => {
    const result = await adminApi.payments.refundPayments({
      refunds: selectedPayments,
    });

    for (const [id, updated] of Object.entries(result.updatedPayments)) {
      const payment = appointment.payments?.find((p) => p._id === id);
      if (!payment) continue;

      const totalRefunded =
        payment.refunds?.reduce((acc, refund) => acc + refund.amount, 0) || 0;

      const defaultAmount = payment.amount - totalRefunded;

      Object.assign(payment, updated);
      setSelected(id, defaultAmount, false, defaultAmount, false);
    }

    if (!result.success) {
      console.error(`Refunds failed:`, result.errors);
      throw new Error(t("admin.appointments.declineDialog.refundError"));
    }
  };

  const handleSuccess = (status: AppointmentStatus) => {
    onSuccess?.(status);
    setPaymentsIdsSelectionState({});
    onOpenChange(false);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        if (!isLoading) onOpenChange(open);
      }}
    >
      {!!trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="md:max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("admin.appointments.declineDialog.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.appointments.declineDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="max-h-[60svh]">
          <div className="flex flex-col gap-4">
            <div className="bg-muted/30 dark:bg-muted/80 text-foreground font-normal rounded-lg p-4 flex flex-col gap-2">
              <h4 className="font-semibold mb-3">
                {t("admin.appointments.declineDialog.appointmentDetails")}
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span className="">
                    {t("admin.appointments.declineDialog.customer")}
                  </span>
                  <span className="font-semibold">
                    {appointment.fields.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="">
                    {t("admin.appointments.declineDialog.service")}
                  </span>
                  <span className="font-semibold">
                    {appointment.option.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="">
                    {t("admin.appointments.declineDialog.dateTime")}
                  </span>
                  <span className="font-semibold">
                    {DateTime.fromJSDate(appointment.dateTime).toLocaleString(
                      DateTime.DATETIME_MED_WITH_WEEKDAY,
                      { locale },
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <Checkbox
                id="requestedByCustomer"
                checked={requestedByCustomer}
                onCheckedChange={(checked) => setRequestedByCustomer(!!checked)}
              />
              <Label htmlFor="requestedByCustomer">
                {t("admin.appointments.declineDialog.requestedByCustomer")}
              </Label>
            </div>
            {!!paymentsAvailableToRefund.length && (
              <div className="flex flex-col gap-2">
                <div className="font-semibold">
                  {t("admin.appointments.declineDialog.refundPayments")}
                </div>

                <div className="flex flex-row flex-wrap gap-2">
                  {paymentsAvailableToRefund.map((payment) => (
                    <PaymentRefundCard
                      key={payment._id}
                      payment={payment}
                      paymentState={paymentsIdsSelectionState[payment._id]}
                      setSelected={setSelected}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t("admin.appointments.declineDialog.cancel")}
          </AlertDialogCancel>
          {!!paymentsAvailableToRefund.length && (
            <AlertDialogAction asChild variant="destructive">
              <AppointmentActionButton
                _id={appointment._id}
                status="declined"
                requestedByCustomer={requestedByCustomer}
                disabled={!selectedPayments.length || isLoading}
                className="mt-2 sm:mt-0"
                beforeRequest={() => refundSelected()}
                setIsLoading={setIsLoading}
                onSuccess={handleSuccess}
                icon={CalendarX2}
              >
                {(() => {
                  const amount = selectedPayments.reduce(
                    (acc, payment) => acc + payment.amount,
                    0,
                  );
                  return t(
                    "admin.appointments.declineDialog.declineAndRefund",
                    {
                      count: selectedPayments.length,
                      amount,
                      amountFormatted: currencyFormat(amount),
                    },
                  );
                })()}
              </AppointmentActionButton>
            </AlertDialogAction>
          )}
          <AlertDialogAction asChild variant="destructive">
            <AppointmentActionButton
              _id={appointment._id}
              status="declined"
              requestedByCustomer={requestedByCustomer}
              disabled={isLoading}
              setIsLoading={setIsLoading}
              onSuccess={handleSuccess}
              icon={CalendarX2}
            >
              {t("admin.appointments.declineDialog.decline")}
            </AppointmentActionButton>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
