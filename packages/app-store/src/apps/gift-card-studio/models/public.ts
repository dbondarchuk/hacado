import {
  IdName,
  zEmail,
  zNonEmptyString,
  zObjectId,
  zPhone,
} from "@hacado/types";
import { z } from "zod";
import { GiftCardStudioPublicAllKeys } from "../translations/types";

export const giftCardPuchaseFormSchema = z
  .object({
    designId: zObjectId(
      "app_gift-card-studio_public.validation.purchase.designId.required" satisfies GiftCardStudioPublicAllKeys,
    ),
    amount: z.coerce.number<number>(
      "app_gift-card-studio_public.validation.purchase.amount.required" satisfies GiftCardStudioPublicAllKeys,
    ),
    name: zNonEmptyString(
      "app_gift-card-studio_public.validation.purchase.name.required" satisfies GiftCardStudioPublicAllKeys,
      1,
      64,
      "app_gift-card-studio_public.validation.purchase.name.max" satisfies GiftCardStudioPublicAllKeys,
    ),
    email: zEmail,
    phone: zPhone,
    message: z.string().optional(),
  })
  .and(
    z
      .object({
        sendToSomeoneElse: z.literal(true, {
          message:
            "app_gift-card-studio_public.validation.purchase.sendToSomeoneElse.required" satisfies GiftCardStudioPublicAllKeys,
        }),
        toName: zNonEmptyString(
          "app_gift-card-studio_public.validation.purchase.toName.required" satisfies GiftCardStudioPublicAllKeys,
          1,
          64,
          "app_gift-card-studio_public.validation.purchase.toName.max" satisfies GiftCardStudioPublicAllKeys,
        ),
        toEmail: zEmail,
      })
      .or(
        z.object({
          sendToSomeoneElse: z.literal(false, {
            message:
              "app_gift-card-studio_public.validation.purchase.sendToSomeoneElse.required" satisfies GiftCardStudioPublicAllKeys,
          }),
        }),
      ),
  );

export type GiftCardPurchaseFormPayload = z.infer<
  typeof giftCardPuchaseFormSchema
>;

export const purchaseRequestSchema = giftCardPuchaseFormSchema.and(
  z.object({
    intentId: zObjectId(),
  }),
);

export type PurchaseRequestPayload = z.infer<typeof purchaseRequestSchema>;

export const fetchPreviewPayloadSchema = z.object({
  designId: zObjectId(
    "app_gift-card-studio_public.validation.purchase.designId.required" satisfies GiftCardStudioPublicAllKeys,
  ),
  amount: z.coerce.number<number>(
    "app_gift-card-studio_public.validation.purchase.amount.required" satisfies GiftCardStudioPublicAllKeys,
  ),
  fromName: z.string().optional(),
  toName: z.string().optional(),
  message: z.string().optional(),
});

export type FetchPreviewPayload = z.infer<typeof fetchPreviewPayloadSchema>;

export type FetchPreviewResponse =
  | {
      success: true;
      imageDataUrl: string;
    }
  | {
      success: false;
      code: string;
      error: string;
    };

export type GetAmountLimitsResponse = {
  minAmount: number;
  maxAmount: number;
};

export type GetDesignsResponse = IdName[];

export type GetInitOptionsResponse = {
  designs: IdName[];
  amountLimits: GetAmountLimitsResponse;
};

export const intentRequestSchema = z.object({
  amount: z.coerce.number<number>(
    "app_gift-card-studio_public.validation.purchase.amount.required" satisfies GiftCardStudioPublicAllKeys,
  ),
  name: zNonEmptyString(
    "app_gift-card-studio_public.validation.purchase.name.required" satisfies GiftCardStudioPublicAllKeys,
    1,
    64,
    "app_gift-card-studio_public.validation.purchase.name.max" satisfies GiftCardStudioPublicAllKeys,
  ),
  email: zEmail,
  phone: zPhone,
  intentId: zObjectId().optional().nullable(),
});

export type IntentRequest = z.infer<typeof intentRequestSchema>;
