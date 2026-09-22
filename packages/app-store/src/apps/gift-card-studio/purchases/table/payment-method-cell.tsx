"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { Payment } from "@hacado/types";
import { Button } from "@hacado/ui";
import { PaymentDetailsDialog } from "@hacado/ui-admin-kit";
import { useState } from "react";
import { PurchasedGiftCardListModel } from "../../models";

export function PaymentMethodCell({
  purchase,
}: {
  purchase: PurchasedGiftCardListModel;
}) {
  const tAdmin = useI18n("admin");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onOpen = async () => {
    if (!purchase.paymentId) {
      return;
    }

    try {
      setLoading(true);
      const result = await adminApi.payments.getPayment(purchase.paymentId);
      setPayment(result);
      setOpen(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="link-dashed"
        className="p-0 h-auto font-medium"
        onClick={onOpen}
        disabled={loading || !purchase.paymentId}
      >
        {tAdmin(`common.labels.paymentMethod.${purchase.paymentMethod}`)}
      </Button>
      {payment ? (
        <PaymentDetailsDialog
          payment={payment}
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) {
              setPayment(null);
            }
          }}
        />
      ) : null}
    </>
  );
}
