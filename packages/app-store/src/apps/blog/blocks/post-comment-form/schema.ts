import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostCommentFormPropsSchema = z.object({
  props: z
    .object({
      nameLabel: z.string().optional().nullable(),
      namePlaceholder: z.string().optional().nullable(),
      emailLabel: z.string().optional().nullable(),
      emailPlaceholder: z.string().optional().nullable(),
      bodyLabel: z.string().optional().nullable(),
      bodyPlaceholder: z.string().optional().nullable(),
      submitLabel: z.string().optional().nullable(),
      successMessage: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
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
