import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostCommentCountPropsSchema = z.object({
  props: z
    .object({
      format: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
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
