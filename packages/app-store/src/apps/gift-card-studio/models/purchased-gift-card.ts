import {
  Customer,
  GiftCardStatus,
  PaymentMethod,
  Prettify,
  WithAppId,
  WithDatabaseId,
  WithOrganizationId,
  zEmail,
  zObjectId,
} from "@hacado/types";
import * as z from "zod";

export const PURCHASED_GIFT_CARDS_COLLECTION_NAME =
  "gift-card-studio-purchased-gift-cards";

export const generationStatusEnum = z.enum(["pending", "completed", "failed"]);
export const deliveryStatusEnum = z.enum(["pending", "scheduled"]);

export const purchasedGiftCardSchemaBase = z.object({
  designId: zObjectId(),
  giftCardId: zObjectId(),
  amountPurchased: z.coerce.number<number>().positive(),
  customerId: zObjectId(),
  toName: z.string().optional(),
  toEmail: z.union([zEmail, z.literal("")]).optional(),
  message: z.string().optional(),
  cardGenerationStatus: generationStatusEnum.default("pending"),
  invoiceGenerationStatus: generationStatusEnum.default("pending"),
  recipientDeliveryStatus: deliveryStatusEnum.default("pending"),
  customerDeliveryStatus: deliveryStatusEnum.default("pending"),
  purchaseChannel: z.enum(["customer", "admin"]).optional(),
});

export type PurchasedGiftCardUpdateModel = z.infer<
  typeof purchasedGiftCardSchemaBase
>;

export type PurchasedGiftCardModel = Prettify<
  WithOrganizationId<
    WithDatabaseId<WithAppId<PurchasedGiftCardUpdateModel>> & {
      createdAt: Date;
      updatedAt: Date;
    }
  >
>;

export type PurchasedGiftCardListModel = PurchasedGiftCardModel & {
  customer: Customer;
  designName: string;
  giftCardCode: string;
  status: GiftCardStatus;
  paymentId: string;
  paymentMethod: PaymentMethod;
  paymentsCount: number;
};

export const getPurchasedGiftCardsQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number<number>().optional(),
  offset: z.coerce.number<number>().optional(),
  sort: z
    .array(
      z.object({
        id: z.string(),
        desc: z.coerce.boolean<boolean>().optional(),
      }),
    )
    .optional(),
  designId: z.array(zObjectId()).or(zObjectId()).optional(),
  customerId: z.array(zObjectId()).or(zObjectId()).optional(),
});

export type GetPurchasedGiftCardsQuery = z.infer<
  typeof getPurchasedGiftCardsQuerySchema
>;
