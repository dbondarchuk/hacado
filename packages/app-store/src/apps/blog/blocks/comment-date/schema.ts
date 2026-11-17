import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogCommentDatePropsSchema = z.object({
  props: z
    .object({
      format: z
        .string()
        .optional()
        .nullable()
        .describe(
          "Date/time format for the comment timestamp (e.g. Luxon preset name).",
        ),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
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
