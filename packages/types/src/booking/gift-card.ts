import { AllKeys, BaseAllKeys } from "@hacado/i18n";
import * as z from "zod";
import { Customer } from "../customers";
import { WithDatabaseId, WithOrganizationId } from "../database";
import { Prettify, zNonEmptyString, zObjectId, zUniqueArray } from "../utils";
import { Payment } from "./payment";

export const giftCardStatus = ["active", "inactive"] as const;
export type GiftCardStatus = (typeof giftCardStatus)[number];

export const giftCardSchema = z.object({
  code: zNonEmptyString(
    "validation.giftCard.code.required" satisfies BaseAllKeys,
    3,
    16,
    "validation.giftCard.code.max" satisfies BaseAllKeys,
  ),
  amount: z.coerce
    .number<number>()
    .min(0.01, "validation.giftCard.amount.min" satisfies BaseAllKeys),
  expiresAt: z.coerce.date<Date>().optional(),
  customerId: zObjectId(
    "validation.giftCard.customerId.required" satisfies BaseAllKeys,
  ),
  paymentId: zObjectId(
    "validation.giftCard.paymentId.required" satisfies BaseAllKeys,
  ),
  source: z
    .object({
      appName: z.string(),
      appId: zObjectId(),
      metadata: z.any().optional(),
    })
    .optional(),
});

export const getGiftCardSchemaWithUniqueCheck = (
  check: (code: string) => Promise<boolean>,
  errorKey: AllKeys,
  omitPaymentId?: boolean,
) => {
  const schema = omitPaymentId
    ? giftCardSchema.omit({ paymentId: true })
    : giftCardSchema;
  return schema.refine((data) => check(data.code), {
    message: errorKey,
  });
};

export type GiftCardUpdateModel = z.infer<typeof giftCardSchema>;
export type GiftCard = Prettify<
  WithOrganizationId<
    WithDatabaseId<GiftCardUpdateModel> & {
      createdAt: Date;
      updatedAt: Date;
      status: GiftCardStatus;
    }
  >
>;

export type GiftCardListModel = Prettify<
  GiftCard & {
    customer: Customer;
    amountLeft: number;
    paymentsCount: number;
    payment: Payment;
  }
>;

export const applyGiftCardsRequestSchema = z.object({
  codes: zUniqueArray(
    z
      .array(
        zNonEmptyString(
          "validation.giftCard.applyRequest.code.required" satisfies BaseAllKeys,
        ),
      )
      .min(1, "validation.giftCard.applyRequest.code.min" satisfies BaseAllKeys)
      .max(
        2,
        "validation.giftCard.applyRequest.code.max" satisfies BaseAllKeys,
      ),
    (x) => x,
    "validation.giftCard.applyRequest.code.unique" satisfies BaseAllKeys,
  ),
  amount: z.coerce
    .number<number>(
      "validation.giftCard.applyRequest.amount.required" satisfies BaseAllKeys,
    )
    .min(
      0.01,
      "validation.giftCard.applyRequest.amount.min" satisfies BaseAllKeys,
    ),
});

export type ApplyGiftCardsRequest = z.infer<typeof applyGiftCardsRequestSchema>;

export type ApplyGiftCardsSuccessResponse = {
  success: true;
  giftCards: {
    id: string;
    code: string;
    appliedAmount: number;
    amountLeft: number;
  }[];
};
export type ApplyGiftCardsErrorResponse = {
  success: false;
  giftCardCode?: string;
  code:
    | "invalid_request_format"
    | "code_not_found"
    | "gift_card_expired"
    | "gift_card_amount_exhausted"
    | "gift_card_inactive"
    | "subscription_upgrade_required";
  error: any;
};

export type ApplyGiftCardsResponse =
  | ApplyGiftCardsSuccessResponse
  | ApplyGiftCardsErrorResponse;
