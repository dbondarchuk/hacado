import { zNonEmptyString } from "@hacado/types";
import * as z from "zod";
import type { SquareAdminAllKeys } from "./translations/types";

const squareInStoreSyncFields = {
  /**
   * When enabled, Square in-store card payments are synced via webhook and
   * auto-matched to appointments.
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
} as const;

export const squareMerchantDataSchema = z.object({
  locationId: zNonEmptyString(
    "app_square_admin.validation.locationId.required" satisfies SquareAdminAllKeys,
  ),
  merchantId: zNonEmptyString(
    "app_square_admin.validation.merchantId.required" satisfies SquareAdminAllKeys,
  ),
  ...squareInStoreSyncFields,
});

export type SquareMerchantData = z.infer<typeof squareMerchantDataSchema>;

/** Admin settings saved after OAuth connect (in-store sync only). */
export const squareSyncSettingsRequestSchema = z.object({
  ...squareInStoreSyncFields,
});

export type SquareSyncSettingsRequest = z.infer<
  typeof squareSyncSettingsRequestSchema
>;

export const squarePayRequestSchema = z.object({
  paymentIntentId: zNonEmptyString(
    "app_square_admin.validation.paymentIntentId.required" satisfies SquareAdminAllKeys,
  ),
  sourceId: zNonEmptyString(
    "app_square_admin.validation.sourceId.required" satisfies SquareAdminAllKeys,
  ),
});

export type SquarePayRequest = z.infer<typeof squarePayRequestSchema>;

export type SquareFormProps = {
  applicationId: string;
  locationId: string;
  isSandbox: boolean;
  className?: string;
};
