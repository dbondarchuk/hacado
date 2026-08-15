import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify, zObjectId } from "@hacado/types";
import * as z from "zod";
import { GiftCardStudioAdminAllKeys } from "../../translations/types";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const GiftCardPurchaseBlockPropsSchema = z.object({
  props: z.object({
    appId: zObjectId(
      "app_gift-card-studio_admin.block.giftCardPurchase.validation.appId.required" satisfies GiftCardStudioAdminAllKeys,
    )
      .optional()
      .nullable(),
    hideTitle: z.boolean().optional().nullable(),
    hideSteps: z.boolean().optional().nullable(),
  }),
  style: zStyles,
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
