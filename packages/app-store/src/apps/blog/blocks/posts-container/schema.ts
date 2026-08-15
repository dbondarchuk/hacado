import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogPostsContainerPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    children: z.array(z.any()),
    postsPerPage: z.number().optional(),
  }),
});

export type BlogPostsContainerProps = z.infer<
  typeof BlogPostsContainerPropsSchema
>;
export type BlogPostsContainerReaderProps = BaseReaderBlockProps<any> &
  BlogPostsContainerProps & { appId?: string };

export const BlogPostsContainerPropsDefaults = {
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
          value: 1,
          unit: "rem",
        },
      },
    ],
  },
  props: {
    children: [],
    postsPerPage: 10,
  },
} as const satisfies BlogPostsContainerProps;
