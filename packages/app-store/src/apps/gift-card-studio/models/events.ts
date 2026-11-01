/** Gift Card Studio app domain events (emitted from app-store). */

export const GIFT_CARD_STUDIO_DESIGN_CREATED_EVENT_TYPE =
  "gift-card-studio.design.created" as const;

export const GIFT_CARD_STUDIO_DESIGN_UPDATED_EVENT_TYPE =
  "gift-card-studio.design.updated" as const;

export const GIFT_CARD_STUDIO_DESIGN_DELETED_EVENT_TYPE =
  "gift-card-studio.design.deleted" as const;

export const GIFT_CARD_STUDIO_PURCHASE_CREATED_EVENT_TYPE =
  "gift-card-studio.purchase.created" as const;

export const GIFT_CARD_STUDIO_PURCHASE_DELETED_EVENT_TYPE =
  "gift-card-studio.purchase.deleted" as const;

export type GiftCardStudioDesignCreatedPayload = {
  appId: string;
  design: { _id: string; name: string };
};

export type GiftCardStudioDesignUpdatedPayload = {
  appId: string;
  design: { _id: string; name: string };
};

export type GiftCardStudioDesignDeletedPayload = {
  appId: string;
  designId: string;
  designName?: string;
};

export type GiftCardStudioPurchaseCreatedPayload = {
  appId: string;
  purchase: {
    _id: string;
    designId: string;
    designName: string;
    amountPurchased: number;
    giftCardCode: string;
    customerName?: string;
    customerEmail?: string;
    recipientName?: string;
    recipientEmail?: string;
  };
};

export type GiftCardStudioPurchaseDeletedPayload = {
  appId: string;
  purchaseId: string;
};
