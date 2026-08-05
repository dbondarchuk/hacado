import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import type { I18nFn } from "@hacado/i18n";
import * as z from "zod";
import { ContainerPropsDefaults } from "../container/schema";
import { ImagePropsDefaults } from "../image/schema";
import { InlineTextPropsDefaults } from "../inline-text/schema";
import { zStyles } from "./styles";

export const MarketingScrollingLogosPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    screenReaderText: z.string().optional().nullable(),
    items: z.object({
      children: z.array(z.any()),
    }),
  }),
});

export type MarketingScrollingLogosProps = z.infer<
  typeof MarketingScrollingLogosPropsSchema
>;
export type MarketingScrollingLogosReaderProps =
  BaseReaderBlockProps<any> & MarketingScrollingLogosProps;

export const MarketingScrollingLogosPropsDefaults = (
  t: I18nFn<undefined, undefined>,
): MarketingScrollingLogosProps => ({
  style: {},
  props: {
    screenReaderText: t(
      "builder.pageBuilder.marketingDefaults.scrollingLogos.screenReaderText",
    ),
    items: {
      children: [
        {
          type: "Container",
          id: generateId(),
          data: {
            ...ContainerPropsDefaults,
            style: {
              ...ContainerPropsDefaults.style,
              display: [{ value: "flex" }],
              flexDirection: [{ value: "column" }],
              alignItems: [{ value: "center" }],
              justifyContent: [{ value: "center" }],
              gap: [{ value: { value: 0.75, unit: "rem" } }],
              width: [{ value: { value: 11, unit: "rem" } }],
              minWidth: [{ value: { value: 11, unit: "rem" } }],
              flexShrink: [{ value: "0" }],
              padding: [
                {
                  value: {
                    top: { value: 1.5, unit: "rem" },
                    bottom: { value: 1.5, unit: "rem" },
                    left: { value: 1.25, unit: "rem" },
                    right: { value: 1.25, unit: "rem" },
                  },
                },
              ],
              borderRadius: [{ value: { value: 16, unit: "px" } }],
              borderStyle: [{ value: "solid" }],
              borderWidth: [{ value: { value: 1, unit: "px" } }],
            },
            props: {
              children: [
                {
                  type: "Image",
                  id: generateId(),
                  data: {
                    ...ImagePropsDefaults,
                    props: {
                      ...ImagePropsDefaults.props,
                      src: "/assets/placeholder/128x128.png",
                      alt: t(
                        "builder.pageBuilder.marketingDefaults.templates.logoCard.logoAlt",
                      ),
                    },
                    style: {
                      ...ImagePropsDefaults.style,
                      width: [{ value: { value: 3, unit: "rem" } }],
                      height: [{ value: { value: 3, unit: "rem" } }],
                    },
                  },
                },
                {
                  type: "InlineText",
                  id: generateId(),
                  data: {
                    props: {
                      text: t(
                        "builder.pageBuilder.marketingDefaults.scrollingLogos.sampleCardName",
                      ),
                    },
                    style: {
                      textAlign: [{ value: "center" }],
                      fontSize: [{ value: { value: 0.875, unit: "rem" } }],
                      fontWeight: [{ value: "500" }],
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  },
});
