import { asOptinalNumberField, zObjectId } from "@hacado/types";
import * as z from "zod";
import { GiftCardStudioAdminAllKeys } from "../translations/types";

export const giftCardStudioSettingsSchema = z
  .object({
    notifyOwnerOnPurchase: z.coerce.boolean<boolean>().optional(),
    emailTemplateIdToPurchaser: zObjectId(
      "app_gift-card-studio_admin.validation.settings.emailTemplateIdToPurchaser.required" satisfies GiftCardStudioAdminAllKeys,
    ),
    emailTemplateIdToRecipient: zObjectId(
      "app_gift-card-studio_admin.validation.settings.emailTemplateIdToRecipient.required" satisfies GiftCardStudioAdminAllKeys,
    ),
    expirationMonths: asOptinalNumberField(
      z.coerce
        .number<number>(
          "app_gift-card-studio_admin.validation.settings.expirationMonths.min" satisfies GiftCardStudioAdminAllKeys,
        )
        .positive(
          "app_gift-card-studio_admin.validation.settings.expirationMonths.min" satisfies GiftCardStudioAdminAllKeys,
        )
        .min(1, {
          message:
            "app_gift-card-studio_admin.validation.settings.expirationMonths.min" satisfies GiftCardStudioAdminAllKeys,
        })
        .max(120, {
          message:
            "app_gift-card-studio_admin.validation.settings.expirationMonths.max" satisfies GiftCardStudioAdminAllKeys,
        }),
    ),
    minAmount: z.coerce
      .number<number>(
        "app_gift-card-studio_admin.validation.settings.minAmount.required" satisfies GiftCardStudioAdminAllKeys,
      )
      .positive(
        "app_gift-card-studio_admin.validation.settings.minAmount.positive" satisfies GiftCardStudioAdminAllKeys,
      )
      .min(5, {
        message:
          "app_gift-card-studio_admin.validation.settings.minAmount.min" satisfies GiftCardStudioAdminAllKeys,
      })
      .max(1000000, {
        message:
          "app_gift-card-studio_admin.validation.settings.minAmount.max" satisfies GiftCardStudioAdminAllKeys,
      }),
    maxAmount: z.coerce
      .number<number>(
        "app_gift-card-studio_admin.validation.settings.maxAmount.required" satisfies GiftCardStudioAdminAllKeys,
      )
      .positive(
        "app_gift-card-studio_admin.validation.settings.maxAmount.positive" satisfies GiftCardStudioAdminAllKeys,
      )
      .min(5, {
        message:
          "app_gift-card-studio_admin.validation.settings.maxAmount.min" satisfies GiftCardStudioAdminAllKeys,
      })
      .max(1000000, {
        message:
          "app_gift-card-studio_admin.validation.settings.maxAmount.max" satisfies GiftCardStudioAdminAllKeys,
      }),
  })
  .superRefine((data, ctx) => {
    if (data.minAmount && data.maxAmount && data.minAmount > data.maxAmount) {
      ctx.addIssue({
        path: ["minAmount"],
        code: z.ZodIssueCode.custom,
        message:
          "app_gift-card-studio_admin.validation.settings.minAmount.minMax" satisfies GiftCardStudioAdminAllKeys,
      });
    }
  });

export type GiftCardStudioSettings = z.infer<
  typeof giftCardStudioSettingsSchema
>;
