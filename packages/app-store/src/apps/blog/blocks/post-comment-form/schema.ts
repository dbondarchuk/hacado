import { BaseReaderBlockProps } from "@hacado/builder/reader";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types/utils";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostCommentFormPropsSchema = z.object({
  props: z
    .object({
      nameLabel: z
        .string()
        .optional()
        .nullable()
        .describe("Label for the commenter name field."),
      namePlaceholder: z
        .string()
        .optional()
        .nullable()
        .describe("Placeholder text for the name field."),
      emailLabel: z
        .string()
        .optional()
        .nullable()
        .describe("Label for the commenter email field."),
      emailPlaceholder: z
        .string()
        .optional()
        .nullable()
        .describe("Placeholder text for the email field."),
      bodyLabel: z
        .string()
        .optional()
        .nullable()
        .describe("Label for the comment body field."),
      bodyPlaceholder: z
        .string()
        .optional()
        .nullable()
        .describe("Placeholder text for the comment body."),
      submitLabel: z
        .string()
        .optional()
        .nullable()
        .describe("Text on the submit button."),
      successMessage: z
        .string()
        .optional()
        .nullable()
        .describe("Message shown after a comment is submitted successfully."),
    })
    .optional()
    .nullable()
    .describe("Block configuration props"),
  style: zStyles.describe(
    "Optional responsive styles for layout, spacing, colors, and typography.",
  ),
});

export type BlogPostCommentFormProps = Prettify<
  z.infer<typeof BlogPostCommentFormPropsSchema>
>;

export type BlogPostCommentFormReaderProps = BaseReaderBlockProps<any> &
  BlogPostCommentFormProps;

export const BlogPostCommentFormPropsDefaults = {
  props: {},
  style: {},
} as const satisfies BlogPostCommentFormProps;

export type BlogPostCommentFormDisplayConfig = {
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  submitLabel: string;
  successMessage: string;
  commentsEnabled: boolean;
  commentsPremoderation: boolean;
};
