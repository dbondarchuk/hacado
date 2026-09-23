import * as z from "zod";
import { asOptinalNumberField } from "../../utils";

/**
 * Booking deposit / payment-threshold settings.
 * Online payments themselves are gated by the default payment app
 * (`defaultApps.paymentAppId`) and the subscription plan — not by a
 * separate `enabled` flag (legacy `enabled` is accepted and ignored).
 */
export const paymentsConfigurationSchema = z
  .object({
    /** @deprecated Ignored. Kept for backwards-compatible stored configs. */
    enabled: z.boolean().optional(),
    fullPaymentAmountThreshold: asOptinalNumberField(
      z.coerce
        .number<number>({
          error:
            "configuration.booking.payments.fullPaymentAmountThreshold.required",
        })
        .min(
          1,
          "configuration.booking.payments.fullPaymentAmountThreshold.min",
        ),
    ),
  })
  .and(
    z.discriminatedUnion("requireDeposit", [
      z.object({
        requireDeposit: z
          .literal(false, {
            error: "configuration.booking.payments.requireDeposit.required",
          })
          .optional(),
      }),
      z.object({
        requireDeposit: z.literal(true, {
          error: "configuration.booking.payments.requireDeposit.required",
        }),
        depositPercentage: z.coerce
          .number<number>({
            error: "configuration.booking.payments.depositPercentage.required",
          })
          .int("configuration.booking.payments.depositPercentage.integer")
          .min(10, "configuration.booking.payments.depositPercentage.min")
          .max(100, "configuration.booking.payments.depositPercentage.max"),
        dontRequireIfCompletedMinNumberOfAppointments: asOptinalNumberField(
          z.coerce
            .number<number>({
              error:
                "configuration.booking.payments.dontRequireIfCompletedMinNumberOfAppointments.min",
            })
            .int(
              "configuration.booking.payments.dontRequireIfCompletedMinNumberOfAppointments.integer",
            )
            .min(
              1,
              "configuration.booking.payments.dontRequireIfCompletedMinNumberOfAppointments.min",
            ),
        ),
      }),
    ]),
  );

export type PaymentsConfiguration = z.infer<typeof paymentsConfigurationSchema>;
