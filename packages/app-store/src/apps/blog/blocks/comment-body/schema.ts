import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogCommentBodyPropsSchema = z.object({
  props: z.object({}).optional().nullable(),
  style: zStyles,
});

export type BlogCommentBodyProps = z.infer<typeof BlogCommentBodyPropsSchema>;
export type BlogCommentBodyReaderProps = BaseReaderBlockProps<any> &
  BlogCommentBodyProps;

export const BlogCommentBodyPropsDefaults = {
  props: {},
  style: {},
} as const satisfies BlogCommentBodyProps;
