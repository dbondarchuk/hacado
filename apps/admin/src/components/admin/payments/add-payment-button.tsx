"use client";

import { useI18n } from "@hacado/i18n/client";
import { Payment } from "@hacado/types/booking";
import { AddUpdatePaymentDialog } from "@hacado/ui-admin-kit/payments";
import { Button } from "@hacado/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function AddPaymentButton({
  customerId,
  labelKey = "paymentsList.addPayment",
}: {
  customerId?: string;
  labelKey?: "paymentsList.addPayment" | "customers.addPayment";
}) {
  const t = useI18n("admin");
  const router = useRouter();

  const onSuccess = (_payment: Payment) => {
    router.refresh();
  };

  return (
    <AddUpdatePaymentDialog
      {...(customerId ? { customerId } : {})}
      onSuccess={onSuccess}
    >
      <Button variant="default" aria-label={t(labelKey)}>
        <Plus className="h-4 w-4" />
        <span className="max-md:hidden">{t(labelKey)}</span>
      </Button>
    </AddUpdatePaymentDialog>
  );
}
