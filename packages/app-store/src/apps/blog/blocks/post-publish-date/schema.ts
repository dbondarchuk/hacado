import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostPublishDatePropsSchema = z.object({
  props: z
    .object({
      format: z
        .string()
        .optional()
        .nullable()
        .describe(
          "Date format string for the publish date (e.g. Luxon or date-fns pattern).",
        ),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
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