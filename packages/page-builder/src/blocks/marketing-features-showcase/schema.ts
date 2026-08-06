import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import type { I18nFn } from "@hacado/i18n";
import * as z from "zod";
import { MarketingFeatureItemPropsDefaults } from "../marketing-feature-item/schema";
import { zStyles } from "./styles";

export const MarketingFeaturesShowcasePropsSchema = z.object({
  style: zStyles,
  props: z.object({
    features: z.object({
      children: z.array(z.any()),
    }),
  }),
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
