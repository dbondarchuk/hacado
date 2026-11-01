import * as z from "zod";

export const modifyEnabledType = [
  "disabled",
  "enabled",
  "notAllowedWithoutDeposit",
] as const;

export const enabledSchema = z.enum(modifyEnabledType, {
  message: "cancellation.policy.enabled.required",
});

export type ModifyEnabledType = z.infer<typeof enabledSchema>;

/**
 * Policy action options for appointments with deposit:
 * - notAllowed: no cancellations allowed in this window
 * - forfeitDeposit: allowed but customer loses 100% of deposit
 * - partialRefund: allowed with a refund percentage of deposit (0-100)
 * - paymentRequired: payment required to cancel
 * - paymentToFullPriceRequired: payment required to cancel, and the payment amount is the full price of the appointment minus the deposit
 * - fullRefund: allowed with full refund
 */
export const appointmentWithDepositCancellationPolicyActionType = [
  "notAllowed",
  "forfeitDeposit",
  "partialRefund",
  "paymentRequired",
  "paymentToFullPriceRequired",
  "fullRefund",
] as const;

export const appointmentWithDepositCancellationPolicyAction = z.enum(
  appointmentWithDepositCancellationPolicyActionType,
  { message: "cancellation.policy.action.required" },
);

export type AppointmentWithDepositCancellationPolicyAction = z.infer<
  typeof appointmentWithDepositCancellationPolicyAction
>;

export const appointmentWithoutDepositCancellationPolicyActionType = [
  "notAllowed",
  "paymentRequired",
  "allowed",
] as const;

export const appointmentWithoutDepositCancellationPolicyAction = z.enum(
  appointmentWithoutDepositCancellationPolicyActionType,
  { message: "cancellation.policy.action.required" },
);

export type AppointmentWithoutDepositCancellationPolicyAction = z.infer<
  typeof appointmentWithoutDepositCancellationPolicyAction
>;

export const modificationPaymentCalculationType = [
  "percentage",
  "amount",
] as const;

export const modificationPaymentCalculationTypeSchema = z.enum(
  modificationPaymentCalculationType,
  {
    message: "cancellation.policy.paymentType.required",
  },
);

/**
 * Policy action options:
 * - notAllowed: no reschedules allowed in this window
 * - allowed: allowed without payment
 * - paymentRequired: payment required to reschedule
 */
export const appointmentReschedulePolicyActionType = [
  "notAllowed",
  "allowed",
  "paymentRequired",
] as const;

export const appointmentReschedulePolicyAction = z.enum(
  appointmentReschedulePolicyActionType,
  { message: "cancellation.policy.action.required" },
);

export type AppointmentReschedulePolicyAction = z.infer<
  typeof appointmentReschedulePolicyAction
>;

const baseAppointmentWithDepositCancellationPolicyRowSchema = z
  .object({
    // optional free-form note for admins
    note: z
      .string()
      .max(500, { message: "cancellation.policy.note.max" })
      .optional(),
  })
  .and(
    z
      .object({
        action: appointmentWithDepositCancellationPolicyAction.extract([
          "forfeitDeposit",
          "notAllowed",
        ]),
      })
      .or(
        z.object({
          action: appointmentWithDepositCancellationPolicyAction.extract([
            "partialRefund",
          ]),
          refundFees: z.coerce.boolean<boolean>().optional(),
          refundPercentage: z.coerce
            .number<number>("cancellation.policy.refundPercentage.required")
            .int({ message: "cancellation.policy.refundPercentage.required" })
            .min(10, { message: "cancellation.policy.refundPercentage.min" })
            .max(100, { message: "cancellation.policy.refundPercentage.max" }),
        }),
      )
      .or(
        z.object({
          action: appointmentWithDepositCancellationPolicyAction.extract([
            "fullRefund",
          ]),
          refundFees: z.coerce.boolean<boolean>().optional(),
        }),
      )
      .or(
        z.object({
          action: appointmentWithDepositCancellationPolicyAction.extract([
            "paymentToFullPriceRequired",
          ]),
          calculateFromOriginalPrice: z.coerce.boolean<boolean>().optional(),
        }),
      )
      .or(
        z
          .object({
            action: appointmentWithDepositCancellationPolicyAction.extract([
              "paymentRequired",
            ]),
          })
          .and(
            z
              .object({
                paymentType: modificationPaymentCalculationTypeSchema.extract([
                  "percentage",
                ]),
                calculateFromOriginalPrice: z.coerce
                  .boolean<boolean>()
                  .optional(),

                paymentPercentage: z.coerce
                  .number<number>(
                    "cancellation.policy.paymentPercentage.required",
                  )
                  .int({
                    message: "cancellation.policy.paymentPercentage.required",
                  })
                  .min(10, {
                    message: "cancellation.policy.paymentPercentage.min",
                  })
                  .max(100, {
                    message: "cancellation.policy.paymentPercentage.max",
                  }),
              })
              .or(
                z.object({
                  paymentType: modificationPaymentCalculationTypeSchema.extract(
                    ["amount"],
                  ),
                  paymentAmount: z.coerce
                    .number<number>(
                      "cancellation.policy.paymentAmount.required",
                    )
                    .min(1, {
                      message: "cancellation.policy.paymentAmount.min",
                    }),
                }),
              ),
          ),
      ),
  );

const baseAppointmentWithoutDepositCancellationPolicyRowSchema = z
  .object({
    // optional free-form note for admins
    note: z
      .string()
      .max(500, { message: "cancellation.policy.note.max" })
      .optional(),
  })
  .and(
    z
      .object({
        action: appointmentWithoutDepositCancellationPolicyAction.extract([
          "notAllowed",
          "allowed",
        ]),
      })
      .or(
        z
          .object({
            action: appointmentWithoutDepositCancellationPolicyAction.extract([
              "paymentRequired",
            ]),
          })
          .and(
            z
              .object({
                paymentType: modificationPaymentCalculationTypeSchema.extract([
                  "percentage",
                ]),
                calculateFromOriginalPrice: z.coerce
                  .boolean<boolean>()
                  .optional(),

                paymentPercentage: z.coerce
                  .number<number>(
                    "cancellation.policy.paymentPercentage.required",
                  )
                  .int({
                    message: "cancellation.policy.paymentPercentage.required",
                  })
                  .min(10, {
                    message: "cancellation.policy.paymentPercentage.min",
                  })
                  .max(100, {
                    message: "cancellation.policy.paymentPercentage.max",
                  }),
              })
              .or(
                z.object({
                  paymentType: modificationPaymentCalculationTypeSchema.extract(
                    ["amount"],
                  ),
                  paymentAmount: z.coerce
                    .number<number>(
                      "cancellation.policy.paymentAmount.required",
                    )
                    .min(1, {
                      message: "cancellation.policy.paymentAmount.min",
                    }),
                }),
              ),
          ),
      ),
  );

const baseAppointmentReschedulePolicyRowSchema = z
  .object({
    // optional free-form note for admins
    note: z
      .string()
      .max(500, { message: "cancellation.policy.note.max" })
      .optional(),
  })
  .and(
    z
      .object({
        action: appointmentReschedulePolicyAction.exclude(["paymentRequired"]),
      })
      .or(
        z
          .object({
            action: appointmentReschedulePolicyAction.extract([
              "paymentRequired",
            ]),
          })
          .and(
            z
              .object({
                paymentType: modificationPaymentCalculationTypeSchema.extract([
                  "percentage",
                ]),
                calculateFromOriginalPrice: z.coerce
                  .boolean<boolean>()
                  .optional(),

                paymentPercentage: z.coerce
                  .number<number>(
                    "cancellation.policy.paymentPercentage.required",
                  )
                  .int({
                    message: "cancellation.policy.paymentPercentage.required",
                  })
                  .min(0, {
                    message: "cancellation.policy.paymentPercentage.min",
                  })
                  .max(100, {
                    message: "cancellation.policy.paymentPercentage.max",
                  }),
              })
              .or(
                z.object({
                  paymentType: modificationPaymentCalculationTypeSchema.extract(
                    ["amount"],
                  ),
                  paymentAmount: z.coerce
                    .number<number>(
                      "cancellation.policy.paymentAmount.required",
                    )
                    .min(1, {
                      message: "cancellation.policy.paymentAmount.min",
                    }),
                }),
              ),
          ),
      ),
  );

const baseAppointmentWithDepositCancellationPolicyRowSuperRefineFunction = (
  val: z.infer<typeof baseAppointmentWithDepositCancellationPolicyRowSchema>,
  ctx: z.RefinementCtx,
) => {
  if (val.action === "partialRefund") {
    if (typeof val.refundPercentage !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "cancellation.policy.refundPercentage.required",
        path: ["refundPercentage"],
      });
    }
  } else if (val.action === "paymentRequired") {
    if (
      val.paymentType === "percentage" &&
      typeof val.paymentPercentage !== "number"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "cancellation.policy.paymentPercentage.required",
        path: ["paymentPercentage"],
      });
    } else if (
      val.paymentType === "amount" &&
      typeof val.paymentAmount !== "number"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "cancellation.policy.paymentAmount.required",
        path: ["paymentAmount"],
      });
    }
  } else {
    // if provided, ensure it's within range (already validated) but warn if unnecessary?
    // We'll simply ignore it for other actions - no error.
  }
};

const baseAppointmentWithoutDepositCancellationPolicyRowSuperRefineFunction = (
  val: z.infer<typeof baseAppointmentWithoutDepositCancellationPolicyRowSchema>,
  ctx: z.RefinementCtx,
) => {
  if (val.action === "paymentRequired") {
    if (
      val.paymentType === "percentage" &&
      typeof val.paymentPercentage !== "number"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "cancellation.policy.paymentPercentage.required",
        path: ["paymentPercentage"],
      });
    } else if (
      val.paymentType === "amount" &&
      typeof val.paymentAmount !== "number"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "cancellation.policy.paymentAmount.required",
        path: ["paymentAmount"],
      });
    }
  }
};

const baseAppointmentReschedulePolicyRowSuperRefineFunction = (
  val: z.infer<typeof baseAppointmentReschedulePolicyRowSchema>,
  ctx: z.RefinementCtx,
) => {
  if (val.action === "paymentRequired") {
    if (
      val.paymentType === "percentage" &&
      typeof val.paymentPercentage !== "number"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "cancellation.policy.paymentPercentage.required",
        path: ["paymentPercentage"],
      });
    } else if (
      val.paymentType === "amount" &&
      typeof val.paymentAmount !== "number"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "cancellation.policy.paymentAmount.required",
        path: ["paymentAmount"],
      });
    }
  }
};

/**
 * Single cancellation policy row:
 * - minutesToAppointment: integer > 0
 *     (meaning "if customer cancels/reschedules at most X minutes before appointment, apply this policy")
 * - action: one of PolicyAction
 * - refundPercentage: required ONLY when action === "partial_refund" (0..100)
 *
 * NOTE: We keep time in minutes for precision; helpers below convert days/hours -> minutes.
 */
export const appointmentWithDepositCancellationPolicyRowSchema = z
  .object({
    minutesToAppointment: z.coerce
      .number<number>()
      .int({
        error: "cancellation.policy.minutesToAppointment.required",
      })
      .positive({
        error: "cancellation.policy.minutesToAppointment.required",
      }),
  })
  .and(baseAppointmentWithDepositCancellationPolicyRowSchema)
  .superRefine(
    baseAppointmentWithDepositCancellationPolicyRowSuperRefineFunction,
  );

export const appointmentWithoutDepositCancellationPolicyRowSchema = z
  .object({
    minutesToAppointment: z.coerce
      .number<number>()
      .int({
        error: "cancellation.policy.minutesToAppointment.required",
      })
      .positive({
        error: "cancellation.policy.minutesToAppointment.required",
      }),
  })
  .and(baseAppointmentWithoutDepositCancellationPolicyRowSchema)
  .superRefine(
    baseAppointmentWithoutDepositCancellationPolicyRowSuperRefineFunction,
  );

export type AppointmentWithDepositCancellationPolicyRow = z.infer<
  typeof appointmentWithDepositCancellationPolicyRowSchema
>;

export type AppointmentWithoutDepositCancellationPolicyRow = z.infer<
  typeof appointmentWithoutDepositCancellationPolicyRowSchema
>;

export const defaultAppointmentWithDepositCancellationPolicyRowSchema =
  baseAppointmentWithDepositCancellationPolicyRowSchema.superRefine(
    baseAppointmentWithDepositCancellationPolicyRowSuperRefineFunction,
  );

export const defaultAppointmentWithoutDepositCancellationPolicyRowSchema =
  baseAppointmentWithoutDepositCancellationPolicyRowSchema.superRefine(
    baseAppointmentWithoutDepositCancellationPolicyRowSuperRefineFunction,
  );

export type DefaultAppointmentWithoutDepositCancellationPolicyRow = z.infer<
  typeof defaultAppointmentWithoutDepositCancellationPolicyRowSchema
>;

export type DefaultAppointmentWithDepositCancellationPolicyRow = z.infer<
  typeof defaultAppointmentWithDepositCancellationPolicyRowSchema
>;

/**
 * Policy array schema: enforces strictly increasing minutesToAppointment order.
 * (each item's time must be greater than the previous one)
 */
export const appointmentWithDepositCancellationPolicyListSchema = z
  .array(appointmentWithDepositCancellationPolicyRowSchema)
  .optional()
  .superRefine((rows, ctx) => {
    if (!rows) {
      return;
    }

    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1].minutesToAppointment;
      const cur = rows[i].minutesToAppointment;
      if (!(cur > prev)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "cancellation.policy.increasing",
          path: [i, "minutesToAppointment"],
        });
      }
    }
  });

export const appointmentWithoutDepositCancellationPolicyListSchema = z
  .array(appointmentWithoutDepositCancellationPolicyRowSchema)
  .optional()
  .superRefine((rows, ctx) => {
    if (!rows) {
      return;
    }

    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1].minutesToAppointment;
      const cur = rows[i].minutesToAppointment;
      if (!(cur > prev)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "cancellation.policy.increasing",
          path: [i, "minutesToAppointment"],
        });
      }
    }
  });

export type AppointmentWithDepositCancellationPolicyList = z.infer<
  typeof appointmentWithDepositCancellationPolicyListSchema
>;

export type AppointmentWithoutDepositCancellationPolicyList = z.infer<
  typeof appointmentWithoutDepositCancellationPolicyListSchema
>;

/**
 * Single reschedule policy row:
 * - minutesToAppointment: integer > 0
 *     (meaning "if customer cancels/reschedules at most X minutes before appointment, apply this policy")
 * - action: one of PolicyAction
 * - paymentPercentage: required ONLY when action === "payment" (0..100)
 *
 * NOTE: We keep time in minutes for precision; helpers below convert days/hours -> minutes.
 */
export const appointmentReschedulePolicyRowSchema = z
  .object({
    minutesToAppointment: z.coerce
      .number<number>()
      .int({
        error: "cancellation.policy.minutesToAppointment.required",
      })
      .positive({
        error: "cancellation.policy.minutesToAppointment.required",
      }),
  })
  .and(baseAppointmentReschedulePolicyRowSchema)
  .superRefine(baseAppointmentReschedulePolicyRowSuperRefineFunction);

export type AppointmentReschedulePolicyRow = z.infer<
  typeof appointmentReschedulePolicyRowSchema
>;

export const defaultAppointmentReschedulePolicyRowSchema =
  baseAppointmentReschedulePolicyRowSchema.superRefine(
    baseAppointmentReschedulePolicyRowSuperRefineFunction,
  );

export type DefaultAppointmentReschedulePolicyRow = z.infer<
  typeof defaultAppointmentReschedulePolicyRowSchema
>;

/**
 * Policy array schema: enforces strictly increasing minutesToAppointment order.
 * (each item's time must be greater than the previous one)
 */
export const appointmentReschedulePolicyListSchema = z
  .array(appointmentReschedulePolicyRowSchema)
  .optional()
  .superRefine((rows, ctx) => {
    if (!rows) {
      return;
    }

    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1].minutesToAppointment;
      const cur = rows[i].minutesToAppointment;
      if (!(cur > prev)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "cancellation.policy.increasing",
          path: [i, "minutesToAppointment"],
        });
      }
    }
  });

export type AppointmentReschedulePolicyList = z.infer<
  typeof appointmentReschedulePolicyListSchema
>;

/**
 * Per-feature (cancellations/reschedules) configuration:
 * - enabled: boolean
 * - policies: array (required if enabled === true)
 * If enabled === false, policies may be present or omitted (we allow present but ignore).
 */
export const appointmentWithDepositCancellationSchema = z.discriminatedUnion(
  "enabled",
  [
    z.object({
      enabled: z.literal(false).optional(),
    }),
    z.object({
      enabled: z.literal(true),
      doNotAllowIfRescheduled: z.coerce.boolean<boolean>().optional(),
      policies: appointmentWithDepositCancellationPolicyListSchema,
      defaultPolicy: defaultAppointmentWithDepositCancellationPolicyRowSchema,
    }),
  ],
);

export const appointmentWithoutDepositCancellationSchema = z.discriminatedUnion(
  "enabled",
  [
    z.object({
      enabled: z.literal(false).optional(),
    }),
    z.object({
      enabled: z.literal(true),
      doNotAllowIfRescheduled: z.coerce.boolean<boolean>().optional(),
      policies: appointmentWithoutDepositCancellationPolicyListSchema,
      defaultPolicy:
        defaultAppointmentWithoutDepositCancellationPolicyRowSchema,
    }),
  ],
);

export type AppointmentWithDepositCancellationConfiguration = z.infer<
  typeof appointmentWithDepositCancellationSchema
>;

export type AppointmentWithoutDepositCancellationConfiguration = z.infer<
  typeof appointmentWithoutDepositCancellationSchema
>;

export const appointmentRescheduleSchema = z.discriminatedUnion("enabled", [
  z.object({
    enabled: z.literal(false).optional(),
  }),
  z.object({
    enabled: z.literal(true),
    maxReschedules: z.coerce
      .number<number>()
      .int({
        error: "cancellation.policy.maxReschedules.required",
      })
      .min(0, {
        error: "cancellation.policy.maxReschedules.required",
      })
      .optional(),
    policies: appointmentReschedulePolicyListSchema.optional(),
    defaultPolicy: defaultAppointmentReschedulePolicyRowSchema,
  }),
]);

export type AppointmentRescheduleConfiguration = z.infer<
  typeof appointmentRescheduleSchema
>;

/**
 * Top-level schema for cancellation/reschedule configuration
 */
export const appointmentCancellationRescheduleSchema = z.object({
  cancellations: z.object({
    withDeposit: appointmentWithDepositCancellationSchema,
    withoutDeposit: appointmentWithoutDepositCancellationSchema,
  }),
  reschedules: appointmentRescheduleSchema,
  // Optional global settings you might want later (example: deposit percentage / currency)
  // depositPercentage: z.number().min(0).max(100).optional(),
});

export type AppointmentCancellationRescheduleConfiguration = z.infer<
  typeof appointmentCancellationRescheduleSchema
>;
