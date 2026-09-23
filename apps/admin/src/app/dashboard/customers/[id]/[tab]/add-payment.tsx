"use client";

import { AddPaymentButton } from "@/components/admin/payments/add-payment-button";

export const AddPayment = ({ customerId }: { customerId: string }) => (
  <AddPaymentButton customerId={customerId} labelKey="customers.addPayment" />
);
