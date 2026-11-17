import { GiftCardPurchaseShowcaseBlockPropsSchema } from "./gift-card-purchase-showcase/schema";
import { GiftCardPurchaseBlockPropsSchema } from "./gift-card-purchase/schema";

export const GiftCardStudioBlocksSchema = {
  GiftCardPurchase: GiftCardPurchaseBlockPropsSchema,
  GiftCardPurchaseShowcase: GiftCardPurchaseShowcaseBlockPropsSchema,
};

export const GiftCardStudioBlocksAllowedInFooter = {
  GiftCardPurchase: false,
  GiftCardPurchaseShowcase: false,
};
