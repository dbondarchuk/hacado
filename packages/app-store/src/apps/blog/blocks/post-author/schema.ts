import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostAuthorPropsSchema = z.object({
  props: z
    .object({
      format: z
        .string()
        .optional()
        .nullable()
        .describe(
          'How the author name is displayed (e.g. "name" or a custom pattern).',
        ),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
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
