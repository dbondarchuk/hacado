import { generateId } from "@hacado/builder/helpers";
import { BaseReaderBlockProps } from "@hacado/builder/reader";
import type { I18nFn } from "@hacado/i18n";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { zStyles } from "./styles";

export const marketingBrowserCarouselSlideSchema = z.object({
  id: z.string().describe("Stable id for this slide"),
  label: z.string().describe("Tab label shown when tabs are enabled"),
  src: z.string().describe("Screenshot or image URL for the slide"),
  addressBar: z
    .string()
    .optional()
    .nullable()
    .describe("Fake browser address bar text for chrome styling"),
});

export type MarketingBrowserCarouselSlide = z.infer<
  typeof marketingBrowserCarouselSlideSchema
>;

export const MarketingBrowserCarouselPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      slides: z
        .array(marketingBrowserCarouselSlideSchema)
        .describe("Slides in the faux browser carousel"),
      showTabs: z.coerce
        .boolean()
        .describe("Show clickable tabs to switch slides"),
      showDots: z.coerce.boolean().describe("Show dot indicators"),
      showBrowserChrome: z.coerce
        .boolean()
        .describe("Render browser window chrome around slides"),
      autoRotateMs: z.coerce
        .number()
        .min(0)
        .describe("Ms between automatic slide changes; 0 disables autoplay"),
    })
    .describe("Block configuration props"),
});

export type MarketingBrowserCarouselProps = Prettify<
  z.infer<typeof MarketingBrowserCarouselPropsSchema>
>;

export type MarketingBrowserCarouselReaderProps = BaseReaderBlockProps<any> &
  MarketingBrowserCarouselProps;

export const MarketingBrowserCarouselPropsDefaults = (
  t: I18nFn<undefined, undefined>,
): MarketingBrowserCarouselProps => ({
  style: {},
  props: {
    slides: [
      {
        id: generateId(),
        label: t(
          "builder.pageBuilder.marketingDefaults.browserCarousel.slide1Label",
        ),
        src: "/assets/placeholder/128x128.png",
        addressBar: t(
          "builder.pageBuilder.marketingDefaults.browserCarousel.slide1Address",
        ),
      },
      {
        id: generateId(),
        label: t(
          "builder.pageBuilder.marketingDefaults.browserCarousel.slide2Label",
        ),
        src: "/assets/placeholder/128x128.png",
        addressBar: t(
          "builder.pageBuilder.marketingDefaults.browserCarousel.slide2Address",
        ),
      },
      {
        id: generateId(),
        label: t(
          "builder.pageBuilder.marketingDefaults.browserCarousel.slide3Label",
        ),
        src: "/assets/placeholder/128x128.png",
        addressBar: t(
          "builder.pageBuilder.marketingDefaults.browserCarousel.slide3Address",
        ),
      },
    ],
    showTabs: true,
    showDots: true,
    showBrowserChrome: true,
    autoRotateMs: 6000,
  },
});