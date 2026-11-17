import { generateId } from "@hacado/builder/helpers";
import { BaseReaderBlockProps } from "@hacado/builder/reader";
import {
  getAllStylesWithAdditionalStyles,
  getStylesSchema,
} from "@hacado/page-builder-base/style";
import * as z from "zod";
import { carouselChildrenAlignStyle } from "./carousel-children-align";
import { carouselChildrenItemsPerSlideStyle } from "./carousel-children-items-per-slide";

export const styles = getAllStylesWithAdditionalStyles({
  carouselChildrenItemsPerSlide: carouselChildrenItemsPerSlideStyle,
  carouselChildrenAlign: carouselChildrenAlignStyle,
});

export const zStyles = getStylesSchema(styles);
export type CarouselStylesSchema = {
  [key in keyof typeof styles]: (typeof styles)[key]["schema"];
};

export const CarouselPropsSchema = z.object({
  style: zStyles.describe(
    "Optional responsive styles. Keys must be from this block's supportedStyles; use getStyleSchema for value shapes.",
  ),
  props: z
    .object({
      orientation: z
        .enum(["horizontal", "vertical"])
        .optional()
        .nullable()
        .describe("Scroll direction of the carousel"),
      navigation: z.coerce
        .boolean<boolean>()
        .optional()
        .nullable()
        .describe("Show previous/next navigation controls"),
      loop: z.coerce
        .boolean<boolean>()
        .optional()
        .nullable()
        .describe("Allow infinite wrap from last slide to first"),
      scale: z.coerce
        .boolean<boolean>()
        .optional()
        .nullable()
        .describe("Scale inactive slides for a depth effect"),
      align: z
        .enum(["start", "center"])
        .optional()
        .nullable()
        .describe("How slides align within the viewport"),
      startIndex: z.coerce
        .number<number>()
        .int()
        .min(0)
        .optional()
        .nullable()
        .describe("Zero-based index of the slide shown initially"),
      autoPlay: z.coerce
        .number<number>()
        .positive()
        .min(1)
        .max(30)
        .optional()
        .nullable()
        .describe("Seconds between automatic slide changes; omit to disable"),
      children: z
        .array(z.any())
        .describe("Slide blocks rendered inside the carousel"),
    })
    .describe("Block configuration props"),
});

export type CarouselProps = z.infer<typeof CarouselPropsSchema>;
export type CarouselReaderProps = BaseReaderBlockProps<any> & CarouselProps;

export const CarouselPropsDefaults = () =>
  ({
    style: {
      gap: [
        {
          value: {
            value: 0.5,
            unit: "rem",
          },
        },
      ],
      justifyItems: [
        {
          value: "center",
        },
      ],
      carouselChildrenItemsPerSlide: [
        {
          value: 1,
          breakpoint: [],
        },
        {
          value: 2,
          breakpoint: ["md"],
        },
        {
          value: 3,
          breakpoint: ["lg"],
        },
        {
          value: 4,
          breakpoint: ["xl"],
        },
      ],
    },
    props: {
      orientation: "horizontal",
      navigation: true,
      children: [
        {
          type: "Image",
          id: generateId(),
          data: {
            props: {
              src: "/assets/placeholder/200x200.jpg",
              alt: "Placeholder",
            },
          },
        },
        {
          type: "Image",
          id: generateId(),
          data: {
            props: {
              src: "/assets/placeholder/200x200.jpg",
              alt: "Placeholder",
            },
          },
        },
      ],
    },
  }) as const satisfies CarouselProps;
