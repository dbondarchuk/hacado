import { zNonEmptyString } from "@hacado/types";
import * as z from "zod";
import { PAYPAL_TRANSACTION_SYNC_JOB_TYPE } from "./const";
import { PaypalAdminAllKeys } from "./translations/types";

export const paypalButtonsShape = ["rect", "pill", "sharp"] as const;
export const paypalButtonLayout = ["vertical", "horizontal"] as const;
export const paypalButtonColor = [
  "gold",
  "blue",
  "silver",
  "white",
  "black",
] as const;
export const paypalButtonLabel = ["paypal", "pay"] as const;

export const paypalConfigurationSchema = z.object({
  clientId: zNonEmptyString(
    "app_paypal_admin.validation.clientId.required" satisfies PaypalAdminAllKeys,
    1,
    256,
    "app_paypal_admin.validation.clientId.max" satisfies PaypalAdminAllKeys,
  ),
  secretKey: zNonEmptyString(
    "app_paypal_admin.validation.secretKey.required" satisfies PaypalAdminAllKeys,
    1,
    256,
    "app_paypal_admin.validation.secretKey.max" satisfies PaypalAdminAllKeys,
  ),
  enableGooglePay: z.boolean(),
  enableApplePay: z.boolean(),
  /**
   * When enabled, PayPal in-store card payments are synced via webhook and
   * periodic transaction polling, then auto-matched to appointments.
   */
  enableInStoreSync: z.boolean().optional(),
  /**
   * How loosely (in minutes) an appointment start time may differ from the
   * transaction time to still be considered a match candidate.
   */
  matchWindowMinutes: z.coerce
    .number<number>()
    .int()
    .positive()
    .max(1440)
    .optional(),
  /**
   * PayPal-generated webhook id. Set server-side when the in-store sync webhook
   * is registered; required to verify webhook signatures.
   */
  webhookId: z.string().optional(),
  buttonStyle: z.object({
    shape: z.enum(paypalButtonsShape, {
      message:
        "app_paypal_admin.validation.buttonStyle.shape.invalid" satisfies PaypalAdminAllKeys,
    }),
    layout: z.enum(paypalButtonLayout, {
      message:
        "app_paypal_admin.validation.buttonStyle.layout.invalid" satisfies PaypalAdminAllKeys,
    }),
    color: z.enum(paypalButtonColor, {
      message:
        "app_paypal_admin.validation.buttonStyle.color.invalid" satisfies PaypalAdminAllKeys,
    }),
    label: z.enum(paypalButtonLabel, {
      message:
        "app_paypal_admin.validation.buttonStyle.label.invalid" satisfies PaypalAdminAllKeys,
    }),
  }),
});

export type PaypalConfiguration = z.infer<typeof paypalConfigurationSchema>;

export type PaypalFormProps = Omit<PaypalConfiguration, "secretKey"> & {
  isSandbox: boolean;
};

export const createOrderRequestSchema = z.object({
  paymentIntentId: zNonEmptyString(
    "app_paypal_admin.validation.paymentIntentId.required" satisfies PaypalAdminAllKeys,
  ),
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export const captureOrderRequestSchema = z.object({
  orderId: zNonEmptyString(
    "app_paypal_admin.validation.orderId.required" satisfies PaypalAdminAllKeys,
  ),
  paymentIntentId: zNonEmptyString(
    "app_paypal_admin.validation.paymentIntentId.required" satisfies PaypalAdminAllKeys,
  ),
});

export type CaptureOrderRequest = z.infer<typeof captureOrderRequestSchema>;

export type PaypalJobPayload = {
  type: typeof PAYPAL_TRANSACTION_SYNC_JOB_TYPE;
};
