"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  SyncedPaymentStandalonePaymentType,
  syncedPaymentStandalonePaymentTypes,
} from "@hacado/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from "@hacado/ui";
import { CustomerSelector } from "@hacado/ui-admin";
import { useEffect, useState } from "react";

const DEFAULT_PAYMENT_TYPE: SyncedPaymentStandalonePaymentType = "other";

export type RecordSyncedPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (details: {
    customerId: string;
    paymentType: SyncedPaymentStandalonePaymentType;
  }) => void | Promise<void>;
};

export const RecordSyncedPaymentDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: RecordSyncedPaymentDialogProps) => {
  const t = useI18n("admin");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [paymentType, setPaymentType] =
    useState<SyncedPaymentStandalonePaymentType>(DEFAULT_PAYMENT_TYPE);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setCustomerId(undefined);
      setPaymentType(DEFAULT_PAYMENT_TYPE);
      setSubmitting(false);
    }
  }, [open]);

  const confirm = async () => {
    if (!customerId) {
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({ customerId, paymentType });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("syncedPayments.recordDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("syncedPayments.recordDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>{t("syncedPayments.recordDialog.customer")}</Label>
            <CustomerSelector
              value={customerId}
              onItemSelect={(value) => setCustomerId(value)}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="synced-record-payment-type">
              {t("syncedPayments.recordDialog.paymentType")}
            </Label>
            <Select
              value={paymentType}
              onValueChange={(value) =>
                setPaymentType(value as SyncedPaymentStandalonePaymentType)
              }
              disabled={submitting}
            >
              <SelectTrigger id="synced-record-payment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {syncedPaymentStandalonePaymentTypes.map((type) => (
                  <SelectItem value={type} key={type}>
                    {t(`payment.types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("syncedPayments.recordDialog.cancel")}
          </Button>
          <Button onClick={confirm} disabled={!customerId || submitting}>
            {submitting && <Spinner />}{" "}
            {t("syncedPayments.recordDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
