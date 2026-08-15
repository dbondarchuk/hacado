import { zNonEmptyString, zUniqueArray } from "@hacado/types";
import * as z from "zod";

export const refundPaymentsSchema = z.object({
  refunds: zUniqueArray(
    z.array(
      z.object({
        id: zNonEmptyString("ID is required"),
        amount: z.number("Amount is required").min(0.01, "Amount is required"),
      }),
    ),
    (s) => s.id,
  ),
});

export type RefundPayments = z.infer<typeof refundPaymentsSchema>;

export const refundPaymentSchema = z.object({
  amount: z.number("Amount is required").min(0.01, "Amount is required"),
});

export type RefundPayment = z.infer<typeof refundPaymentSchema>;
