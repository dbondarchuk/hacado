import { EditorDocumentBlocksDictionary } from "@hacado/builder";
import { Gem, Gift } from "lucide-react";
import { GiftCardStudioAdminAllKeys } from "../translations/types";
import {
  GiftCardPurchaseBlockConfiguration,
  GiftCardPurchaseBlockEditor,
  GiftCardPurchaseBlockPropsDefaults,
  GiftCardPurchaseBlockPropsSchema,
} from "./gift-card-purchase";
import {
  GiftCardPurchaseShowcaseBlockConfiguration,
  GiftCardPurchaseShowcaseBlockEditor,
  GiftCardPurchaseShowcaseBlockPropsDefaults,
  GiftCardPurchaseShowcaseBlockPropsSchema,
} from "./gift-card-purchase-showcase";

export const GiftCardStudioBlocksSchema = {
  GiftCardPurchase: GiftCardPurchaseBlockPropsSchema,
  GiftCardPurchaseShowcase: GiftCardPurchaseShowcaseBlockPropsSchema,
};

export const GiftCardStudioBlocksAllowedInFooter = {
  GiftCardPurchase: false,
  GiftCardPurchaseShowcase: false,
};

export const GiftCardStudioBlocksDefaultMetadata = (
  _appName: string,
  appId: string,
): Record<string, unknown> => ({
  giftCardStudioAppId: appId,
});

export const GiftCardStudioEditors: EditorDocumentBlocksDictionary<
  typeof GiftCardStudioBlocksSchema
> = {
  GiftCardPurchase: {
    displayName:
      "app_gift-card-studio_admin.block.giftCardPurchase.displayName" satisfies GiftCardStudioAdminAllKeys,
    icon: <Gift />,
    Configuration: GiftCardPurchaseBlockConfiguration,
    Editor: GiftCardPurchaseBlockEditor as any,
    defaultValue: GiftCardPurchaseBlockPropsDefaults,
    category:
      "app_gift-card-studio_admin.block.giftCardPurchase.category" satisfies GiftCardStudioAdminAllKeys,
    capabilities: ["block"],
    tags: ["gift-card"],
    allowedBuilderTypes: ["page"],
  },
  GiftCardPurchaseShowcase: {
    displayName:
      "app_gift-card-studio_admin.block.giftCardPurchaseShowcase.displayName" satisfies GiftCardStudioAdminAllKeys,
    icon: <Gem />,
    Configuration: GiftCardPurchaseShowcaseBlockConfiguration,
    Editor: GiftCardPurchaseShowcaseBlockEditor as any,
    defaultValue: GiftCardPurchaseShowcaseBlockPropsDefaults,
    category:
      "app_gift-card-studio_admin.block.giftCardPurchase.category" satisfies GiftCardStudioAdminAllKeys,
    capabilities: ["block"],
    tags: ["gift-card"],
    allowedBuilderTypes: ["page"],
  },
};

type GiftCardStudioBlocksType = {
  [K in keyof typeof GiftCardStudioBlocksSchema]: {
    schema: (typeof GiftCardStudioBlocksSchema)[K];
    editor: (typeof GiftCardStudioEditors)[K];
    allowedInFooter: (typeof GiftCardStudioBlocksAllowedInFooter)[K];
    defaultMetadata: (
      appName: string,
      appId: string,
    ) => Record<string, unknown>;
  };
};

export const GiftCardStudioBlocks = Object.fromEntries(
  Object.entries(GiftCardStudioBlocksSchema).map(([key, schema]) => [
    key,
    {
      schema,
      editor:
        GiftCardStudioEditors[key as keyof typeof GiftCardStudioBlocksSchema],
      allowedInFooter:
        GiftCardStudioBlocksAllowedInFooter[
          key as keyof typeof GiftCardStudioBlocksSchema
        ],
      defaultMetadata: GiftCardStudioBlocksDefaultMetadata,
    },
  ]),
) as GiftCardStudioBlocksType;
