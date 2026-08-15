import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostReadTimePropsSchema = z.object({
  props: z
    .object({
      format: z.string().optional().nullable(),
      wordsPerMinute: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
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
