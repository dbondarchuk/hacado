import { Prettify, zObjectId, zTaggedUnion, zUniqueArray } from "@hacado/types";
import * as z from "zod";
import { designSchemaBase, getDesignsQuerySchema } from "./design";
import {
  getPurchasedGiftCardsQuerySchema,
  purchasedGiftCardSchemaBase,
} from "./purchased-gift-card";

export const createDesignActionSchema = z.object({
  design: designSchemaBase,
});
export type CreateDesignAction = z.infer<typeof createDesignActionSchema>;
export const CreateDesignActionType = "gift-card-studio-create-design" as const;

export const updateDesignActionSchema = z.object({
  id: zObjectId(),
  design: designSchemaBase,
});
export type UpdateDesignAction = z.infer<typeof updateDesignActionSchema>;
export const UpdateDesignActionType = "gift-card-studio-update-design" as const;

export const deleteDesignActionSchema = z.object({
  id: zObjectId(),
});
export type DeleteDesignAction = z.infer<typeof deleteDesignActionSchema>;
export const DeleteDesignActionType = "gift-card-studio-delete-design" as const;

export const deleteDesignsActionSchema = z.object({
  ids: zUniqueArray(z.array(zObjectId()).min(1), (id) => id),
});
export type DeleteDesignsAction = z.infer<typeof deleteDesignsActionSchema>;
export const DeleteDesignsActionType =
  "gift-card-studio-delete-designs" as const;

export const setDesignArchivedActionSchema = z.object({
  id: zObjectId(),
  isArchived: z.coerce.boolean<boolean>(),
});
export type SetDesignArchivedAction = z.infer<
  typeof setDesignArchivedActionSchema
>;
export const SetDesignArchivedActionType =
  "gift-card-studio-set-design-archived" as const;

export const setDesignsArchivedActionSchema = z.object({
  ids: zUniqueArray(z.array(zObjectId()).min(1), (id) => id),
  isArchived: z.coerce.boolean<boolean>(),
});
export type SetDesignsArchivedAction = z.infer<
  typeof setDesignsArchivedActionSchema
>;
export const SetDesignsArchivedActionType =
  "gift-card-studio-set-designs-archived" as const;

export const getDesignsActionSchema = z.object({
  query: getDesignsQuerySchema,
});
export type GetDesignsAction = z.infer<typeof getDesignsActionSchema>;
export const GetDesignsActionType = "gift-card-studio-get-designs" as const;

export const getDesignByIdActionSchema = z.object({
  id: zObjectId(),
});
export type GetDesignByIdAction = z.infer<typeof getDesignByIdActionSchema>;
export const GetDesignByIdActionType =
  "gift-card-studio-get-design-by-id" as const;

export const checkDesignNameUniqueActionSchema = z.object({
  name: z.string().min(1),
  id: zObjectId().optional(),
});
export type CheckDesignNameUniqueAction = z.infer<
  typeof checkDesignNameUniqueActionSchema
>;
export const CheckDesignNameUniqueActionType =
  "gift-card-studio-check-design-name-unique" as const;

export const markGiftCardStudioPurchasesReadActionSchema = z.object({});

export type MarkGiftCardStudioPurchasesReadAction = z.infer<
  typeof markGiftCardStudioPurchasesReadActionSchema
>;
export const MarkGiftCardStudioPurchasesReadActionType =
  "gift-card-studio-mark-purchases-read" as const;

export const getPurchasedGiftCardsActionSchema = z.object({
  query: getPurchasedGiftCardsQuerySchema,
});
export type GetPurchasedGiftCardsAction = z.infer<
  typeof getPurchasedGiftCardsActionSchema
>;
export const GetPurchasedGiftCardsActionType =
  "gift-card-studio-get-purchased-gift-cards" as const;

export const getPurchasedGiftCardByIdActionSchema = z.object({
  id: zObjectId(),
});
export type GetPurchasedGiftCardByIdAction = z.infer<
  typeof getPurchasedGiftCardByIdActionSchema
>;
export const GetPurchasedGiftCardByIdActionType =
  "gift-card-studio-get-purchased-gift-card-by-id" as const;

export const regenerateGiftCardAssetsActionSchema = z.object({
  id: zObjectId(),
  assetType: z.enum(["gift-card", "invoice"]),
});
export type RegenerateGiftCardAssetsAction = z.infer<
  typeof regenerateGiftCardAssetsActionSchema
>;
export const RegenerateGiftCardAssetsActionType =
  "gift-card-studio-regenerate-assets" as const;

export const deletePurchasedGiftCardActionSchema = z.object({
  id: zObjectId(),
});
export type DeletePurchasedGiftCardAction = z.infer<
  typeof deletePurchasedGiftCardActionSchema
>;
export const DeletePurchasedGiftCardActionType =
  "gift-card-studio-delete-purchased-gift-card" as const;

export const resendEmailActionSchema = z.object({
  id: zObjectId(),
  participantType: z.enum(["customer", "recipient"]),
});
export type ResendEmailAction = z.infer<typeof resendEmailActionSchema>;
export const ResendEmailActionType =
  "gift-card-studio-resend-email-to-customer" as const;

export const createPurchasedGiftCardActionSchema = z.object({
  purchase: purchasedGiftCardSchemaBase
    .omit({
      giftCardId: true,
      cardGenerationStatus: true,
      invoiceGenerationStatus: true,
      recipientDeliveryStatus: true,
      customerDeliveryStatus: true,
    })
    .extend({
      paymentType: z.enum(["cash", "in-person-card"]),
      sendCustomerEmail: z.coerce.boolean<boolean>().optional(),
      sendRecipientEmail: z.coerce.boolean<boolean>().optional(),
    }),
});
export type CreatePurchasedGiftCardAction = z.infer<
  typeof createPurchasedGiftCardActionSchema
>;
export const CreatePurchasedGiftCardActionType =
  "gift-card-studio-create-purchased-gift-card" as const;

export const getPreviewActionSchema = z.object({
  designId: zObjectId(),
  amount: z.coerce.number(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  toName: z.string().optional(),
  toEmail: z.string().optional(),
  message: z.string().optional(),
});
export type GetPreviewAction = z.infer<typeof getPreviewActionSchema>;
export const GetPreviewActionType = "gift-card-studio-get-preview" as const;

export const getSettingsActionSchema = z.object({});
export type GetSettingsAction = z.infer<typeof getSettingsActionSchema>;
export const GetSettingsActionType = "gift-card-studio-get-settings" as const;

export const updateSettingsActionSchema = z.object({
  emailTemplateIdToPurchaser: z.string().optional(),
  emailTemplateIdToRecipient: z.string().optional(),
  minAmount: z.coerce.number<number>().optional(),
  maxAmount: z.coerce.number<number>().optional(),
  notifyOwnerOnPurchase: z.coerce.boolean<boolean>().optional(),
});
export type UpdateSettingsAction = z.infer<typeof updateSettingsActionSchema>;
export const UpdateSettingsActionType =
  "gift-card-studio-update-settings" as const;

export const requestActionSchema = zTaggedUnion([
  { type: CreateDesignActionType, data: createDesignActionSchema },
  { type: UpdateDesignActionType, data: updateDesignActionSchema },
  { type: DeleteDesignActionType, data: deleteDesignActionSchema },
  { type: DeleteDesignsActionType, data: deleteDesignsActionSchema },
  { type: SetDesignArchivedActionType, data: setDesignArchivedActionSchema },
  { type: SetDesignsArchivedActionType, data: setDesignsArchivedActionSchema },
  { type: GetDesignsActionType, data: getDesignsActionSchema },
  { type: GetDesignByIdActionType, data: getDesignByIdActionSchema },
  {
    type: CheckDesignNameUniqueActionType,
    data: checkDesignNameUniqueActionSchema,
  },
  {
    type: GetPurchasedGiftCardsActionType,
    data: getPurchasedGiftCardsActionSchema,
  },
  {
    type: GetPurchasedGiftCardByIdActionType,
    data: getPurchasedGiftCardByIdActionSchema,
  },
  {
    type: CreatePurchasedGiftCardActionType,
    data: createPurchasedGiftCardActionSchema,
  },
  { type: GetPreviewActionType, data: getPreviewActionSchema },
  { type: GetSettingsActionType, data: getSettingsActionSchema },
  { type: UpdateSettingsActionType, data: updateSettingsActionSchema },
  {
    type: RegenerateGiftCardAssetsActionType,
    data: regenerateGiftCardAssetsActionSchema,
  },
  {
    type: DeletePurchasedGiftCardActionType,
    data: deletePurchasedGiftCardActionSchema,
  },
  {
    type: ResendEmailActionType,
    data: resendEmailActionSchema,
  },
  {
    type: MarkGiftCardStudioPurchasesReadActionType,
    data: markGiftCardStudioPurchasesReadActionSchema,
  },
]);

export type RequestAction = Prettify<z.infer<typeof requestActionSchema>>;

export type GiftCardStudioJobPayload =
  | {
      type: "generate-gift-card";
      purchasedGiftCardId: string;
      sendEmails?: {
        recipient: boolean;
        customer: boolean;
      };
    }
  | {
      type: "generate-invoice";
      purchasedGiftCardId: string;
      sendEmails?: {
        recipient: boolean;
        customer: boolean;
      };
    };
