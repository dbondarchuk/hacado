import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";
import { BlogAdminAllKeys } from "../../translations/types";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

const maxParagraphsValidation =
  "app_blog_admin.validation.postContent.maxParagraphs.validation" satisfies BlogAdminAllKeys;

export const BlogPostContentPropsSchema = z.object({
  props: z
    .object({
      showShort: z
        .literal(false)
        .optional()
        .describe("Render the full post body instead of a short excerpt."),
    })
    .or(
      z.object({
        showShort: z
          .literal(true)
          .optional()
          .describe("Render a truncated excerpt instead of the full post body."),
        maxParagraphs: z.coerce
          .number(maxParagraphsValidation)
          .int(maxParagraphsValidation)
          .min(1, maxParagraphsValidation)
          .max(10, maxParagraphsValidation)
          .optional()
          .describe("Maximum paragraphs to include in the short excerpt (1-10)."),
        showOnlyTextParagraphs: z
          .boolean()
          .optional()
          .describe(
            "Include only text paragraphs in the excerpt, skipping media blocks.",
          ),
      }),
    )
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
});

export type BlogPostContentProps = Prettify<
  z.infer<typeof BlogPostContentPropsSchema>
>;

export type BlogPostContentReaderProps = BaseReaderBlockProps<any> &
  BlogPostContentProps;

export const BlogPostContentPropsDefaults = {
  props: {
    showShort: false,
  },
  style: {
    display: [
      {
        value: "flex",
      },
    ],
    flexDirection: [
      {
        value: "column",
      },
    ],
  },
} as const satisfies BlogPostContentProps;

/** Props for list/card excerpts (used in templates and default pages). */
export const BlogPostShortContentProps = {
  showShort: true,
  maxParagraphs: 5,
  showOnlyTextParagraphs: false,
} as const;