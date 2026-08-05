import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostTitlePropsSchema = z.object({
  props: z.object({}).optional().nullable(),
  style: zStyles,
});

export type BlogPostTitleProps = Prettify<
  z.infer<typeof BlogPostTitlePropsSchema>
>;
export type BlogPostTitleReaderProps = BaseReaderBlockProps<any> &
  BlogPostTitleProps;

export const BlogPostTitlePropsDefaults = {
  props: {},
  style: {
    fontSize: [
      {
        value: {
          value: 2,
          unit: "rem",
        },
      },
    ],
    fontWeight: [
      {
        value: "bold",
      },
    ],
  },
} as const satisfies BlogPostTitleProps;
