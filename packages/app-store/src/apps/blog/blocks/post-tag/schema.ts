import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import { Prettify } from "@hacado/types";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostTagPropsSchema = z.object({
  props: z
    .object({
      blogListUrl: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  style: zStyles,
});

export type BlogPostTagProps = Prettify<z.infer<typeof BlogPostTagPropsSchema>>;
export type BlogPostTagReaderProps = BaseReaderBlockProps<any> &
  BlogPostTagProps;

export const BlogPostTagPropsDefaults = {
  props: {
    blogListUrl: undefined,
  },
  style: {
    padding: [
      {
        value: {
          top: { value: 0.5, unit: "rem" },
          bottom: { value: 0.5, unit: "rem" },
          left: { value: 1, unit: "rem" },
          right: { value: 1, unit: "rem" },
        },
      },
    ],
    borderRadius: [
      {
        value: {
          value: 0.5,
          unit: "rem",
        },
      },
    ],
    backgroundColor: [
      {
        value: "var(--value-secondary-color)",
      },
    ],
    color: [
      {
        value: "var(--value-secondary-foreground-color)",
      },
    ],
    fontSize: [
      {
        value: {
          value: 0.875,
          unit: "rem",
        },
      },
    ],
    fontWeight: [
      {
        value: "500",
      },
    ],
    display: [
      {
        value: "inline-block",
      },
    ],
    width: [
      {
        value: "fit-content",
      },
    ],
    textAlign: [
      {
        value: "center",
      },
    ],
  },
} as const satisfies BlogPostTagProps;
