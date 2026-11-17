import { generateId } from "@hacado/builder/helpers";
import { BaseReaderBlockProps } from "@hacado/builder/reader";
import type { I18nFn } from "@hacado/i18n";
import * as z from "zod";
import { MarketingFeatureItemPropsDefaults } from "../marketing-feature-item/schema";
import { zStyles } from "./styles";

export const MarketingFeaturesShowcasePropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      features: z
        .object({
          children: z
            .array(z.any())
            .describe("MarketingFeatureItem blocks in the showcase"),
        })
        .describe("Feature cards slot"),
    })
    .describe("Block configuration props"),
});

export type MarketingFeaturesShowcaseProps = z.infer<
  typeof MarketingFeaturesShowcasePropsSchema
>;

export type MarketingFeaturesShowcaseReaderProps = BaseReaderBlockProps<any> &
  MarketingFeaturesShowcaseProps;

export const MarketingFeaturesShowcasePropsDefaults = (
  t: I18nFn<undefined, undefined>,
): MarketingFeaturesShowcaseProps => ({
  style: {},
  props: {
    features: {
      children: [
        {
          type: "MarketingFeatureItem",
          id: generateId(),
          data: MarketingFeatureItemPropsDefaults(t),
        },
        {
          type: "MarketingFeatureItem",
          id: generateId(),
          data: MarketingFeatureItemPropsDefaults(t),
        },
      ],
    },
  },
});
