import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostAuthorPropsSchema = z.object({
  props: z
    .object({
      format: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
});

export type BlogPostAuthorProps = Prettify<
  z.infer<typeof BlogPostAuthorPropsSchema>
>;
export type BlogPostAuthorReaderProps = BaseReaderBlockProps<any> &
  BlogPostAuthorProps;

export const BlogPostAuthorPropsDefaults = {
  props: {
    format: "name",
  },
  style: {},
} as const satisfies BlogPostAuthorProps;
