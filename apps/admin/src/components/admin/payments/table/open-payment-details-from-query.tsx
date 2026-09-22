"use client";

import { adminApi } from "@hacado/api-sdk";
import { Payment } from "@hacado/types";
import { PaymentDetailsDialog } from "@hacado/ui-admin-kit";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

export function OpenPaymentDetailsFromQuery() {
  const [paymentId, setPaymentId] = useQueryState(
    "id",
    parseAsString.withOptions({ shallow: true, history: "replace" }),
  );
  const [payment, setPayment] = useState<Payment | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!paymentId) {
      setPayment(null);
      setOpen(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await adminApi.payments.getPayment(paymentId);
        if (cancelled) {
          return;
        }

        setPayment(result);
        setOpen(true);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          void setPaymentId(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentId, setPaymentId]);

  if (!payment) {
    return null;
  }

  return (
    <PaymentDetailsDialog
      payment={payment}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setPayment(null);
          void setPaymentId(null);
        }
      }}
    />
  );
}
