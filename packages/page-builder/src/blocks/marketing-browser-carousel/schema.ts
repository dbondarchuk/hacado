import { BaseReaderBlockProps, generateId } from "@hacado/builder";
import type { I18nFn } from "@hacado/i18n";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { zStyles } from "./styles";

export const marketingBrowserCarouselSlideSchema = z.object({
  id: z.string(),
  label: z.string(),
  src: z.string(),
  addressBar: z.string().optional().nullable(),
});

export type MarketingBrowserCarouselSlide = z.infer<
  typeof marketingBrowserCarouselSlideSchema
>;

export const MarketingBrowserCarouselPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    slides: z.array(marketingBrowserCarouselSlideSchema),
    showTabs: z.coerce.boolean(),
    showDots: z.coerce.boolean(),
    showBrowserChrome: z.coerce.boolean(),
    autoRotateMs: z.coerce.number().min(0),
  }),
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
