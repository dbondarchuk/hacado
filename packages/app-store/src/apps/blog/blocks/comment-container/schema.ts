import { BaseReaderBlockProps } from "@hacado/builder";
import { ALL_STYLES, getStylesSchema } from "@hacado/page-builder-base/style";
import * as z from "zod";

export const styles = ALL_STYLES;
export const zStyles = getStylesSchema(styles);

export const BlogCommentContainerPropsSchema = z.object({
  style: zStyles,
  props: z.object({
    children: z.array(z.any()),
  }),
});

export type BlogCommentContainerProps = z.infer<
  typeof BlogCommentContainerPropsSchema
>;
export type BlogCommentContainerReaderProps = BaseReaderBlockProps<any> &
  BlogCommentContainerProps;

export const BlogCommentContainerPropsDefaults = {
  style: {
    padding: [
      {
        value: {
          top: { value: 0.75, unit: "rem" },
          bottom: { value: 0.75, unit: "rem" },
          left: { value: 0, unit: "rem" },
          right: { value: 0, unit: "rem" },
        },
      },
    ],
    display: [{ value: "flex" }],
    flexDirection: [{ value: "column" }],
    width: [{ value: { value: 100, unit: "%" } }],
    gap: [{ value: { value: 0.25, unit: "rem" } }],
  },
  props: {
    children: [],
  },
} as const satisfies BlogCommentContainerProps;
