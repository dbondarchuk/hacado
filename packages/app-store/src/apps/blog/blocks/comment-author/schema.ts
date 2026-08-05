import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogCommentAuthorPropsSchema = z.object({
  props: z.object({}).optional().nullable(),
  style: zStyles,
});

export type BlogCommentAuthorProps = z.infer<
  typeof BlogCommentAuthorPropsSchema
>;
export type BlogCommentAuthorReaderProps = BaseReaderBlockProps<any> &
  BlogCommentAuthorProps;

export const BlogCommentAuthorPropsDefaults = {
  props: {},
  style: {},
} as const satisfies BlogCommentAuthorProps;
