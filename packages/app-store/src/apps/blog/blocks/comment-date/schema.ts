import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogCommentDatePropsSchema = z.object({
  props: z
    .object({
      format: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
});

export type BlogCommentDateProps = z.infer<typeof BlogCommentDatePropsSchema>;
export type BlogCommentDateReaderProps = BaseReaderBlockProps<any> &
  BlogCommentDateProps;

export const BlogCommentDatePropsDefaults = {
  props: {
    format: "DATETIME_MED",
  },
  style: {},
} as const satisfies BlogCommentDateProps;
