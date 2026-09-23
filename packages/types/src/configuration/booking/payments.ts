import * as z from "zod";
import { asOptinalNumberField, zUniqueArray } from "../../utils";

export const bookingTipsModes = ["off", "on", "full-payment-only"] as const;
export type BookingTipsMode = (typeof bookingTipsModes)[number];

export const bookingTipPresetSchema = z.coerce
  .number<number>()
  .int()
  .min(1, "configuration.booking.payments.tipPresets.min")
  .max(100, "configuration.booking.payments.tipPresets.max");

export const bookingTipPresetsSchema = zUniqueArray(
  z
    .array(bookingTipPresetSchema)
    .max(4, "configuration.booking.payments.tipPresets.maxItems"),
  (x) => x,
  "configuration.booking.payments.tipPresets.unique",
);

export const bookingTipsModeSchema = z.enum(bookingTipsModes, {
  error: "configuration.booking.payments.tipsMode.required",
});

/** Resolved tips config for the public booking UI (no inherit). */
export type ResolvedBookingTips = {
  mode: BookingTipsMode;
  presets: number[];
};

export const resolvedBookingTipsSchema = z.object({
  mode: bookingTipsModeSchema,
  presets: bookingTipPresetsSchema,
});

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
    /** Tip collection during booking. Defaults to off when omitted. */
    tipsMode: bookingTipsModeSchema.optional(),
    /** Percentage presets (1–100). Max 4. Used when tipsMode is not off. */
    tipPresets: bookingTipPresetsSchema.optional(),
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

export const optionTipsModes = [
  "inherit",
  "off",
  "on",
  "full-payment-only",
] as const;
export type OptionTipsMode = (typeof optionTipsModes)[number];

export const optionTipsModeSchema = z.enum(optionTipsModes, {
  error: "validation.appointments.option.tipsMode.required",
});

export function resolveBookingTips(
  orgPayments:
    | Pick<PaymentsConfiguration, "tipsMode" | "tipPresets">
    | null
    | undefined,
  optionTipsMode?: OptionTipsMode | null,
  optionTipPresets?: number[] | null,
): ResolvedBookingTips {
  const mode: BookingTipsMode =
    !optionTipsMode || optionTipsMode === "inherit"
      ? (orgPayments?.tipsMode ?? "off")
      : optionTipsMode;

  if (mode === "off") {
    return { mode: "off", presets: [] };
  }

  const presetsSource =
    optionTipsMode && optionTipsMode !== "inherit"
      ? optionTipPresets
      : orgPayments?.tipPresets;

  const presets = (presetsSource ?? []).filter(
    (value) => typeof value === "number" && value >= 1 && value <= 100,
  );

  return { mode, presets: presets.slice(0, 4) };
}

export function isBookingTipsVisible(
  tips: ResolvedBookingTips | null | undefined,
  chargeAmount: number,
  amountTotal: number,
  amountPaid: number,
): boolean {
  if (!tips || tips.mode === "off") {
    return false;
  }
  if (tips.mode === "on") {
    return true;
  }

  const remaining = Math.max(0, amountTotal - amountPaid);
  return chargeAmount >= remaining - 0.005;
}
