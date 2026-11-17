import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostReadTimePropsSchema = z.object({
  props: z
    .object({
      format: z
        .string()
        .optional()
        .nullable()
        .describe(
          'How read time is labeled (e.g. "minRead" or a custom pattern).',
        ),
      wordsPerMinute: z
        .number()
        .optional()
        .nullable()
        .describe("Average reading speed used to estimate read time."),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
});

export type BlogPostReadTimeProps = Prettify<
  z.infer<typeof BlogPostReadTimePropsSchema>
>;

export type BlogPostReadTimeReaderProps = BaseReaderBlockProps<any> &
  BlogPostReadTimeProps;

export const BlogPostReadTimePropsDefaults = {
  props: {
    format: "minRead",
    wordsPerMinute: 200,
  },
  style: {},
} as const satisfies BlogPostReadTimeProps;