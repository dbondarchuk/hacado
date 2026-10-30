import type { ValidationKeys } from "@hacado/i18n/keys";

import * as z from "zod";
import type { CustomerAppointmentTextOffer } from "../apps/text-message/customer-appointment-text";
import {
  appointmentRescheduleSchema,
  appointmentWithDepositCancellationSchema,
  appointmentWithoutDepositCancellationSchema,
} from "../configuration/booking/cancellation";
import {
  bookingTipPresetsSchema,
  optionTipsModeSchema,
  type ResolvedBookingTips,
} from "../configuration/booking/payments";
import { WithDatabaseId, WithOrganizationId } from "../database";
import {
  asOptinalNumberField,
  zNonEmptyString,
  zObjectId,
  zUniqueArray,
} from "../utils";
import { DistributiveOmit, Prettify } from "../utils/helpers";
import type { AppointmentPackage } from "./appointment-package";
import { FieldSchema } from "./field";
import {
  addonStaffOverridesSchema,
  PublicStaffMember,
  staffAssignmentsSchema,
} from "./staff-assignment";

export const isRequiredOptionTypes = ["inherit", "always", "never"] as const;
export const optionPaymentCalculationType = ["percentage", "amount"] as const;
export const optionDurationType = ["fixed", "flexible"] as const;
export const optionDurationTypeSchema = z.enum(optionDurationType, {
  error: "services.durationType.required" satisfies ValidationKeys,
});

export const optionAppointmentModificationPolicyType = [
  "inherit",
  "custom",
] as const;
export const optionAppointmentModificationPolicyTypeSchema = z.enum(
  optionAppointmentModificationPolicyType,
  {
    error: "services.cancellationPolicyType.required" satisfies ValidationKeys,
  },
);

export const optionPaymentCalculationTypeSchema = z.enum(
  optionPaymentCalculationType,
  {
    error: "services.paymentType.required" satisfies ValidationKeys,
  },
);

const isRequiredOptionSchema = z.enum(isRequiredOptionTypes);

export const appointmentOptionSchema = z
  .object({
    name: zNonEmptyString(
      "validation.services.name.required",
      2,
      256,
      "validation.services.name.max",
    ),
    // description: z.array(z.any()),
    description: zNonEmptyString(
      "validation.services.description.required",
      2,
      1024,
      "validation.services.description.max",
    ),
    addons: zUniqueArray(
      z.array(
        z.object({
          id: zObjectId("validation.services.addons.id.required"),
        }),
      ),
      (addon) => addon.id,
      "validation.services.addons.id.unique",
    ).optional(),
    fields: zUniqueArray(
      z.array(
        z.object({
          id: zNonEmptyString("validation.services.fields.id.required"),
          required: z.coerce.boolean<boolean>().optional(),
        }),
      ),
      (field) => field.id,
      "validation.services.fields.id.unique",
    ).optional(),
    /** Staff members who can perform this service (+ optional price/duration overrides). Empty = not bookable. */
    staff: staffAssignmentsSchema,
    isAutoConfirm: isRequiredOptionSchema,
    duplicateAppointmentCheck: z
      .object({
        enabled: z.literal(true, {
          error:
            "validation.services.duplicateAppointmentCheck.enabled.required",
        }),
        message: zNonEmptyString(
          "validation.services.duplicateAppointmentCheck.message.required",
        ),
        days: z.coerce
          .number<number>({
            error: "validation.services.duplicateAppointmentCheck.days.min",
          })
          .int("validation.services.duplicateAppointmentCheck.days.min")
          .min(1, "validation.services.duplicateAppointmentCheck.days.min")
          .max(30, "validation.services.duplicateAppointmentCheck.days.max"),
        doNotAllowScheduling: z.coerce.boolean<boolean>().optional(),
      })
      .or(
        z.object({
          enabled: z
            .literal(false, {
              error:
                "services.duplicateAppointmentCheck.enabled.required" satisfies ValidationKeys,
            })
            .default(false)
            .optional()
            .nullable(),
        }),
      )
      .optional(),
    cancellationPolicy: z
      .object({
        withDeposit: z
          .object({
            type: optionAppointmentModificationPolicyTypeSchema.extract([
              "inherit",
            ]),
          })
          .or(
            z
              .object({
                type: optionAppointmentModificationPolicyTypeSchema.extract([
                  "custom",
                ]),
              })
              .and(appointmentWithDepositCancellationSchema),
          ),
        withoutDeposit: z
          .object({
            type: optionAppointmentModificationPolicyTypeSchema.extract([
              "inherit",
            ]),
          })
          .or(
            z
              .object({
                type: optionAppointmentModificationPolicyTypeSchema.extract([
                  "custom",
                ]),
              })
              .and(appointmentWithoutDepositCancellationSchema),
          ),
      })
      .optional(),
    reschedulePolicy: z
      .object({
        type: optionAppointmentModificationPolicyTypeSchema.extract([
          "inherit",
        ]),
      })
      .or(
        z
          .object({
            type: optionAppointmentModificationPolicyTypeSchema.extract([
              "custom",
            ]),
          })
          .and(appointmentRescheduleSchema),
      )
      .optional(),
  })
  .and(
    z
      .object({
        requireDeposit: isRequiredOptionSchema
          .exclude(["always"], {
            error: "validation.services.requireDeposit.required",
          })
          .optional()
          .nullable(),
      })
      .or(
        z
          .object({
            requireDeposit: isRequiredOptionSchema.extract(["always"], {
              error: "validation.services.requireDeposit.required",
            }),
          })
          .and(
            z
              .object({
                paymentType: optionPaymentCalculationTypeSchema.extract([
                  "percentage",
                ]),
                depositPercentage: z.coerce
                  .number<number>({
                    error: "validation.services.depositPercentage.required",
                  })
                  .int("validation.services.depositPercentage.required")
                  .min(10, "validation.services.depositPercentage.required")
                  .max(100, "validation.services.depositPercentage.required"),
              })
              .or(
                z.object({
                  paymentType: optionPaymentCalculationTypeSchema.extract([
                    "amount",
                  ]),
                  depositAmount: z.coerce
                    .number<number>({
                      error: "validation.services.depositAmount.required",
                    })
                    .min(1, "validation.services.depositAmount.required"),
                }),
              ),
          ),
      ),
  )
  .and(
    z.object({
      tipsMode: optionTipsModeSchema.optional().nullable(),
      tipPresets: bookingTipPresetsSchema.optional().nullable(),
    }),
  )
  .and(
    z
      .object({
        isOnline: z.literal(false, {
          error: "services.isOnline.required" satisfies ValidationKeys,
        }),
      })
      .or(
        z.object({
          isOnline: z.literal(true, {
            error: "services.isOnline.required" satisfies ValidationKeys,
          }),
        }),
      ),
  )
  .and(
    z
      .object({
        durationType: optionDurationTypeSchema.extract(["fixed"]),
        duration: z.coerce
          .number<number>()
          .int("validation.services.duration.positive")
          .min(1, "validation.services.duration.positive"),
        price: asOptinalNumberField(
          z.coerce.number<number>().min(1, "validation.services.price.min"),
        ),
      })
      .or(
        z.object({
          durationType: optionDurationTypeSchema.extract(["flexible"]),
          durationMin: z.coerce
            .number<number>()
            .int("validation.services.durationMin.positive")
            .min(1, "validation.services.durationMin.positive"),
          durationMax: z.coerce
            .number<number>()
            .int("validation.services.durationMax.positive")
            .min(1, "validation.services.durationMax.positive")
            .max(60 * 24 * 1, "validation.services.durationMax.max"),
          durationStep: z.coerce
            .number<number>()
            .int("validation.services.durationStep.positive")
            .min(1, "validation.services.durationStep.positive"),
          pricePerHour: asOptinalNumberField(
            z.coerce
              .number<number>(
                "services.pricePerHour.required" satisfies ValidationKeys,
              )
              .min(1, "services.pricePerHour.min" satisfies ValidationKeys),
          ),
        }),
      ),
  );

export type AppointmentOptionUpdateModel = Prettify<
  z.infer<typeof appointmentOptionSchema>
>;

export type AppointmentOption = Prettify<
  WithOrganizationId<
    WithDatabaseId<
      AppointmentOptionUpdateModel & {
        updatedAt: Date;
      }
    >
  >
>;

export const getAppointmentOptionSchemaWithUniqueCheck = (
  uniqueNameCheckFn: (name: string) => Promise<boolean>,
  message: string,
) => {
  return appointmentOptionSchema.superRefine(async (args, ctx) => {
    if (!args.name) return;

    const isUnique = await uniqueNameCheckFn(args.name);
    if (!isUnique) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message,
      });
    }
  });
};

export const appointmentAddonSchema = z.object({
  name: zNonEmptyString(
    "validation.addons.name.required",
    2,
    256,
    "validation.addons.name.max",
  ),
  // description: z.array(z.any()),
  description: zNonEmptyString(
    "validation.addons.description.required",
    2,
    1024,
    "validation.addons.description.max",
  ),
  duration: asOptinalNumberField(
    z.coerce
      .number<number>()
      .int("validation.addons.duration.positive")
      .min(1, "validation.addons.duration.positive"),
  ),
  price: asOptinalNumberField(
    z.coerce.number<number>().min(1, "validation.addons.price.min"),
  ),
  /**
   * Per-member overrides for this addon. Empty = all parent-service staff can
   * offer it at base price/duration. Entries may set price/duration overrides
   * or mark a member unavailable (`unavailable: true`).
   */
  staff: addonStaffOverridesSchema,
  fields: zUniqueArray(
    z.array(
      z.object({
        id: zObjectId("validation.services.fields.id.required"),
        required: z.coerce.boolean<boolean>().optional(),
      }),
    ),
    (field) => field.id,
    "validation.services.fields.id.unique",
  ).optional(),
});

export const getAppointmentAddonSchemaWithUniqueCheck = (
  uniqueNameCheckFn: (name: string) => Promise<boolean>,
  message: string,
) => {
  return appointmentAddonSchema.superRefine(async (args, ctx) => {
    if (!args.name) return;

    const isUnique = await uniqueNameCheckFn(args.name);
    if (!isUnique) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message,
      });
    }
  });
};

export type AppointmentAddonUpdateModel = z.infer<
  typeof appointmentAddonSchema
>;

export type AppointmentAddon = Prettify<
  WithOrganizationId<
    WithDatabaseId<
      AppointmentAddonUpdateModel & {
        updatedAt: Date;
      }
    >
  >
>;

export const appointmentAddonsSchema = z
  .array(appointmentAddonSchema)
  .optional();
export type AppointmentAddons = z.infer<typeof appointmentAddonsSchema>;

export type AppointmentChoice = Prettify<
  DistributiveOmit<AppointmentOption, "addons" | "tipsMode" | "tipPresets"> & {
    addons: AppointmentAddon[];
    /** Resolved tips settings for the public booking payment step. */
    tips: ResolvedBookingTips;
  }
>;

export const BookingRestrictionCode = {
  LimitReached: "limit_reached",
} as const;

export type BookingRestrictionCode =
  (typeof BookingRestrictionCode)[keyof typeof BookingRestrictionCode];

export type BookingRestriction = {
  code: BookingRestrictionCode;
};

export const isBookingLimitRestriction = (
  restriction?: BookingRestriction,
): boolean => restriction?.code === BookingRestrictionCode.LimitReached;

export type GetAppointmentOptionsResponse = {
  options: AppointmentChoice[];
  fieldsSchema: Record<string, FieldSchema>;
  showPromoCode: boolean;
  bookingRestriction?: BookingRestriction;
  /** Active staff members, for resolving `AppointmentOption.staff` assignments in the public booking UI. */
  members: PublicStaffMember[];
  catalog?: import("../configuration/booking").BookingCatalogNode[];
  packages?: AppointmentPackage[];
  requireCustomerOtp?: boolean;
  /** True when this organization has at least one redeemable customer package. */
  hasActiveCustomerPackages?: boolean;
  /** Which appointment texts a connected app can send. Empty flags hide the consent checkbox. */
  smsText: CustomerAppointmentTextOffer;
};
