import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostContainerPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    children: z.array(z.any()),
    postUrl: z
      .string()
      .min(1, "app_blog_admin.block.postContainer.errors.postUrl.required")
      .regex(
        /\[slug\]/,
        "app_blog_admin.block.postContainer.errors.postUrl.slug",
      ),
  }),
});

export type BlogPostContainerProps = z.infer<
  typeof BlogPostContainerPropsSchema
>;
export type BlogPostContainerReaderProps = BaseReaderBlockProps<any> &
  BlogPostContainerProps & { appId?: string };

export const BlogPostContainerPropsDefaults = {
  style: {
    padding: [
      {
        value: {
          top: { value: 1, unit: "rem" },
          bottom: { value: 1, unit: "rem" },
          left: { value: 1.5, unit: "rem" },
          right: { value: 1.5, unit: "rem" },
        },
      },
    ],
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
    width: [
      {
        value: { value: 100, unit: "%" },
      },
    ],
    gap: [
      {
        value: {
          value: 0.5,
          unit: "rem",
        },
      },
    ],
  },
  props: {
    children: [],
    postUrl: "/blog/[slug]",
  },
} as const satisfies BlogPostContainerProps;
