import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostCommentCountPropsSchema = z.object({
  props: z
    .object({
      format: z
        .string()
        .optional()
        .nullable()
        .describe(
          'How the comment count is formatted (e.g. "count" or a custom pattern).',
        ),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
});

export type BlogPostCommentCountProps = Prettify<
  z.infer<typeof BlogPostCommentCountPropsSchema>
>;

export type BlogPostCommentCountReaderProps = BaseReaderBlockProps<any> &
  BlogPostCommentCountProps;

export const BlogPostCommentCountPropsDefaults = {
  props: {
    format: "count",
  },
  style: {},
} as const satisfies BlogPostCommentCountProps;