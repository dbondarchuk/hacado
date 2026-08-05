import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostPublishDatePropsSchema = z.object({
  props: z
    .object({
      format: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
});

export type BlogPostPublishDateProps = Prettify<
  z.infer<typeof BlogPostPublishDatePropsSchema>
>;
export type BlogPostPublishDateReaderProps = BaseReaderBlockProps<any> &
  BlogPostPublishDateProps;

export const BlogPostPublishDatePropsDefaults = {
  props: {
    format: "MMMM d, yyyy",
  },
  style: {},
} as const satisfies BlogPostPublishDateProps;
