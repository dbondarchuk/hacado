import {
  paymentTypeSchema,
  zNonEmptyString,
  zObjectId,
  zUniqueArray,
} from "@hacado/types";
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

export const createPaymentLinkSchema = z
  .object({
    amount: z
      .number("validation.payments.amount.positive")
      .positive("validation.payments.amount.positive"),
    customerId: zObjectId("validation.payments.customerId.required"),
    appointmentId: zObjectId().optional(),
    description: z.string().max(1024).optional(),
    type: paymentTypeSchema.optional().default("payment"),
    paymentLinkAppId: zObjectId(
      "validation.payments.paymentLinkAppId.required",
    ),
    channel: z.enum(["email", "sms", "copy"]).optional(),
    to: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.channel === "email" || data.channel === "sms") &&
      (!data.to || data.to.trim().length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "validation.payments.to.required",
      });
    }
  });

export type CreatePaymentLinkBody = z.infer<typeof createPaymentLinkSchema>;

export const resendPaymentLinkSchema = z.object({
  channel: z.enum(["email", "sms"]),
  to: zNonEmptyString("validation.payments.to.required"),
});

export type ResendPaymentLinkBody = z.infer<typeof resendPaymentLinkSchema>;
