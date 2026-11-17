import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify, zObjectId } from "@hacado/types/utils";
import * as z from "zod";
import { GiftCardStudioAdminAllKeys } from "../../translations/types";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const GiftCardPurchaseBlockPropsSchema = z.object({
  props: z
    .object({
      appId: zObjectId(
        "app_gift-card-studio_admin.block.giftCardPurchase.validation.appId.required" satisfies GiftCardStudioAdminAllKeys,
      )
        .optional()
        .nullable()
        .describe(
          "MongoDB ObjectId of the gift card studio app instance to use.",
        ),
      hideTitle: z
        .boolean()
        .optional()
        .nullable()
        .describe("Hide the purchase flow title."),
      hideSteps: z
        .boolean()
        .optional()
        .nullable()
        .describe("Hide the step indicator in the purchase flow."),
    })
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
});

export type GiftCardPurchaseBlockProps = Prettify<
  z.infer<typeof GiftCardPurchaseBlockPropsSchema>
>;

export type GiftCardPurchaseBlockReaderProps = BaseReaderBlockProps<any> &
  GiftCardPurchaseBlockProps;

export const GiftCardPurchaseBlockPropsDefaults = {
  props: {
    appId: null,
    hideTitle: false,
    hideSteps: false,
  },
  style: {},
} as const satisfies GiftCardPurchaseBlockProps;
