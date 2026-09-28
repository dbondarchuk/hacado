import { BaseReaderBlockProps } from "@hacado/builder";
import type { I18nFn } from "@hacado/i18n";
import {
  embeddedSlotSchema,
  migratePropsSlots,
} from "@hacado/page-builder-base/slots";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { DEFAULT_AMOUNT_PRESETS, MAX_AMOUNT_PRESETS } from "./presets";
import { createShowcaseSlots } from "./slot-defaults";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

const SLOT_KEYS = ["title", "abovePreview", "belowPreview"] as const;
const zSlot = embeddedSlotSchema(zStyles);

export const GiftCardPurchaseShowcaseBlockPropsSchema = z.object({
  props: z.preprocess(
    (val) =>
      val && typeof val === "object"
        ? migratePropsSlots(val as Record<string, unknown>, [...SLOT_KEYS])
        : val,
    z.object({
      hideTitle: z.boolean().optional().nullable(),
      hideSteps: z.boolean().optional().nullable(),
      previewPosition: z.enum(["left", "right"]).optional().nullable(),
      abovePreviewFirstOnMobile: z.boolean().optional().nullable(),
      amountPresets: z
        .array(z.number().positive())
        .max(MAX_AMOUNT_PRESETS)
        .optional()
        .nullable(),
      title: zSlot,
      abovePreview: zSlot,
      belowPreview: zSlot,
    }),
  ),
  style: zStyles,
});

export type GiftCardPurchaseShowcaseBlockProps = Prettify<
  z.infer<typeof GiftCardPurchaseShowcaseBlockPropsSchema>
>;
export type GiftCardPurchaseShowcaseBlockReaderProps =
  BaseReaderBlockProps<any> & GiftCardPurchaseShowcaseBlockProps;

export function GiftCardPurchaseShowcaseBlockPropsDefaults(
  t: I18nFn<undefined, undefined>,
): GiftCardPurchaseShowcaseBlockProps {
  return {
    props: {
      hideTitle: false,
      hideSteps: false,
      previewPosition: "left",
      abovePreviewFirstOnMobile: true,
      amountPresets: [...DEFAULT_AMOUNT_PRESETS],
      ...createShowcaseSlots(t),
    },
    style: {},
  };
}
