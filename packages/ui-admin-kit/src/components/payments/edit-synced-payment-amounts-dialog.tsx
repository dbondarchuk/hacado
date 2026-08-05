"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  HydratedSyncedPayment,
  SyncedPaymentAssignablePaymentType,
  syncedPaymentAssignablePaymentTypes,
} from "@hacado/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  toastPromise,
  useCurrencyFormat,
  useCurrencySymbol,
} from "@hacado/ui";
import { round2 } from "@hacado/utils";
import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_PAYMENT_TYPE: SyncedPaymentAssignablePaymentType = "payment";

const resolveAmounts = (payment: HydratedSyncedPayment) => {
  const tip = payment.inferredTip ?? 0;
  const paymentAmount =
    payment.paymentAmount ?? round2((payment.amount ?? 0) - tip);
  const paymentType =
    payment.paymentType ?? payment.originalPaymentType ?? DEFAULT_PAYMENT_TYPE;
  const originalPaymentType =
    payment.originalPaymentType ?? payment.paymentType ?? DEFAULT_PAYMENT_TYPE;
  const hasOriginals =
    payment.originalAmount !== undefined && payment.originalTip !== undefined;
  return {
    paymentAmount,
    tip,
    paymentType,
    originalAmount: payment.originalAmount,
    originalTip: payment.originalTip,
    originalPaymentType,
    hasOriginals,
  };
};

export type EditSyncedPaymentAmountsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: HydratedSyncedPayment;
  onUpdated?: () => void;
};

export const EditSyncedPaymentAmountsDialog = ({
  open,
  onOpenChange,
  payment,
  onUpdated,
}: EditSyncedPaymentAmountsDialogProps) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();
  const currencyFormat = useCurrencyFormat();

  const resolved = resolveAmounts(payment);
  const [paymentAmount, setPaymentAmount] = useState(resolved.paymentAmount);
  const [tip, setTip] = useState(resolved.tip);
  const [paymentType, setPaymentType] = useState(resolved.paymentType);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const next = resolveAmounts(payment);
      setPaymentAmount(next.paymentAmount);
      setTip(next.tip);
      setPaymentType(next.paymentType);
    }
  }, [open, payment]);

  const parsedPayment = round2(Math.max(0, paymentAmount || 0));
  const parsedTip = round2(Math.max(0, tip || 0));
  const total = round2(parsedPayment + parsedTip);

  const canRevert =
    resolved.hasOriginals &&
    (parsedPayment !== resolved.originalAmount ||
      parsedTip !== resolved.originalTip ||
      paymentType !== resolved.originalPaymentType);

  const run = async (promise: Promise<unknown>) => {
    setSubmitting(true);
    try {
      await toastPromise(promise, {
        success: t("syncedPayments.toast.success"),
        error: t("syncedPayments.toast.error"),
      });
      onUpdated?.();
      onOpenChange(false);
    } catch (error) {
      // toastPromise already surfaced the error
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("syncedPayments.editAmounts.title")}</DialogTitle>
          <DialogDescription>
            {t("syncedPayments.editAmounts.description", {
              charged: currencyFormat(payment.amount ?? 0),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="synced-payment-type">
              {t("syncedPayments.editAmounts.paymentType")}
            </Label>
            <Select
              value={paymentType}
              onValueChange={(value) =>
                setPaymentType(value as SyncedPaymentAssignablePaymentType)
              }
              disabled={submitting}
            >
              <SelectTrigger id="synced-payment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {syncedPaymentAssignablePaymentTypes.map((type) => (
                  <SelectItem value={type} key={type}>
                    {t(`payment.types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="synced-payment-amount">
              {t("syncedPayments.editAmounts.paymentAmount")}
            </Label>
            <InputGroup>
              <InputGroupAddon
                className={InputGroupAddonClasses({ variant: "prefix" })}
              >
                {currencySymbol}
              </InputGroupAddon>
              <InputGroupInput>
                <Input
                  id="synced-payment-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={paymentAmount}
                  disabled={submitting}
                  onChange={(event) =>
                    setPaymentAmount(Number(event.target.value) || 0)
                  }
                  className={InputGroupInputClasses({ variant: "prefix" })}
                />
              </InputGroupInput>
            </InputGroup>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="synced-tip-amount">
                {t("syncedPayments.editAmounts.tip")}
              </Label>
              {parsedTip > 0 && (
                <Button
                  variant="link-dashed"
                  size="sm"
                  type="button"
                  disabled={submitting}
                  onClick={() => setTip(0)}
                >
                  {t("syncedPayments.editAmounts.removeTip")}
                </Button>
              )}
            </div>
            <InputGroup>
              <InputGroupAddon
                className={InputGroupAddonClasses({ variant: "prefix" })}
              >
                {currencySymbol}
              </InputGroupAddon>
              <InputGroupInput>
                <Input
                  id="synced-tip-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={tip}
                  disabled={submitting}
                  onChange={(event) => setTip(Number(event.target.value) || 0)}
                  className={InputGroupInputClasses({ variant: "prefix" })}
                />
              </InputGroupInput>
            </InputGroup>
          </div>

          <div className="flex justify-between text-base border-t border-border pt-3">
            <span className="text-muted-foreground">
              {t("syncedPayments.editAmounts.total")}
            </span>
            <span className="font-medium">{currencyFormat(total)}</span>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            type="button"
            disabled={submitting || !canRevert}
            onClick={() =>
              run(
                adminApi.syncedPayments.revertSyncedPaymentAmounts(payment._id),
              )
            }
          >
            <RotateCcw className="size-4" />{" "}
            {t("syncedPayments.editAmounts.revert")}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              {t("syncedPayments.editAmounts.cancel")}
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={() =>
                run(
                  adminApi.syncedPayments.updateSyncedPaymentAmounts(
                    payment._id,
                    {
                      paymentAmount: parsedPayment,
                      tip: parsedTip,
                      paymentType,
                    },
                  ),
                )
              }
            >
              {submitting && <Spinner />} {t("syncedPayments.editAmounts.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
